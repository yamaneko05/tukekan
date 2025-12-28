"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { createId } from "@paralleldrive/cuid2";
import {
  generateJWT,
  setSessionCookie,
  getSession,
} from "@/lib/auth";
import { Role } from "@/app/generated/prisma";

// 招待コードでグループを取得
export async function getGroupByInviteCode(inviteCode: string) {
  const group = await prisma.group.findUnique({
    where: { inviteCode },
    select: { id: true, name: true },
  });
  return group;
}

// 招待経由での新規登録
const registerSchema = z.object({
  name: z
    .string()
    .min(1, "ユーザー名を入力してください")
    .max(50, "ユーザー名は50文字以内で入力してください"),
  password: z
    .string()
    .min(6, "パスワードは6文字以上で入力してください"),
  inviteCode: z.string().min(1, "招待コードが必要です"),
});

export type RegisterState = {
  error?: string;
};

export async function registerWithInvite(
  _prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const result = registerSchema.safeParse({
    name: formData.get("name"),
    password: formData.get("password"),
    inviteCode: formData.get("inviteCode"),
  });

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const { name, password, inviteCode } = result.data;

  // グループを取得
  const group = await prisma.group.findUnique({
    where: { inviteCode },
  });

  if (!group) {
    return { error: "無効な招待リンクです" };
  }

  // グループ内での名前重複チェック
  const existingAccount = await prisma.account.findFirst({
    where: { groupId: group.id, name },
  });

  if (existingAccount) {
    return { error: "このユーザー名は既に使用されています" };
  }

  const passwordHash = await hashPassword(password);

  // 既存メンバーを取得
  const existingMembers = await prisma.account.findMany({
    where: { groupId: group.id },
    select: { id: true, name: true },
  });

  // アカウント作成
  const newAccount = await prisma.account.create({
    data: {
      name,
      passwordHash,
      groupId: group.id,
      role: Role.MEMBER,
    },
  });

  // 既存メンバーとの双方向Partner作成
  if (existingMembers.length > 0) {
    const partnerData = existingMembers.flatMap((member) => [
      // 既存メンバーに新メンバーのPartnerを作成
      {
        name: newAccount.name,
        ownerId: member.id,
        linkedAccountId: newAccount.id,
      },
      // 新メンバーに既存メンバーのPartnerを作成
      {
        name: member.name,
        ownerId: newAccount.id,
        linkedAccountId: member.id,
      },
    ]);

    await prisma.partner.createMany({ data: partnerData });
  }

  // ログイン処理
  const token = await generateJWT({
    userId: newAccount.id,
    name: newAccount.name,
  });
  await setSessionCookie(token);

  redirect("/");
}

// 招待コード再生成（管理者のみ）
export type RegenerateInviteCodeState = {
  success?: boolean;
  error?: string;
  newInviteCode?: string;
};

export async function regenerateInviteCode(): Promise<RegenerateInviteCodeState> {
  const session = await getSession();
  if (!session) {
    return { error: "ログインが必要です" };
  }

  const account = await prisma.account.findUnique({
    where: { id: session.userId },
    include: { group: true },
  });

  if (!account) {
    return { error: "アカウントが見つかりません" };
  }

  if (account.role !== Role.ADMIN) {
    return { error: "管理者権限が必要です" };
  }

  const newInviteCode = createId();

  await prisma.group.update({
    where: { id: account.groupId },
    data: { inviteCode: newInviteCode },
  });

  return { success: true, newInviteCode };
}

// グループ名変更（管理者のみ）
const updateGroupNameSchema = z.object({
  name: z
    .string()
    .min(1, "グループ名を入力してください")
    .max(50, "グループ名は50文字以内で入力してください"),
});

export type UpdateGroupNameState = {
  success?: boolean;
  error?: string;
};

export async function updateGroupName(
  _prevState: UpdateGroupNameState,
  formData: FormData
): Promise<UpdateGroupNameState> {
  const session = await getSession();
  if (!session) {
    return { error: "ログインが必要です" };
  }

  const result = updateGroupNameSchema.safeParse({
    name: formData.get("name"),
  });

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const account = await prisma.account.findUnique({
    where: { id: session.userId },
  });

  if (!account) {
    return { error: "アカウントが見つかりません" };
  }

  if (account.role !== Role.ADMIN) {
    return { error: "管理者権限が必要です" };
  }

  await prisma.group.update({
    where: { id: account.groupId },
    data: { name: result.data.name },
  });

  return { success: true };
}

// メンバー削除（管理者のみ）
export type RemoveMemberState = {
  success?: boolean;
  error?: string;
};

export async function removeMember(memberId: string): Promise<RemoveMemberState> {
  const session = await getSession();
  if (!session) {
    return { error: "ログインが必要です" };
  }

  const currentAccount = await prisma.account.findUnique({
    where: { id: session.userId },
  });

  if (!currentAccount) {
    return { error: "アカウントが見つかりません" };
  }

  if (currentAccount.role !== Role.ADMIN) {
    return { error: "管理者権限が必要です" };
  }

  // 自分自身は削除できない
  if (memberId === session.userId) {
    return { error: "自分自身を削除することはできません" };
  }

  const targetAccount = await prisma.account.findUnique({
    where: { id: memberId },
  });

  if (!targetAccount) {
    return { error: "メンバーが見つかりません" };
  }

  // 同じグループのメンバーのみ削除可能
  if (targetAccount.groupId !== currentAccount.groupId) {
    return { error: "このメンバーを削除する権限がありません" };
  }

  // Partnerのリンクを解除
  await prisma.partner.updateMany({
    where: { linkedAccountId: memberId },
    data: { linkedAccountId: null },
  });

  await prisma.partner.updateMany({
    where: { ownerId: memberId },
    data: { linkedAccountId: null },
  });

  // アカウント削除
  await prisma.account.delete({
    where: { id: memberId },
  });

  return { success: true };
}

// グループメンバー一覧取得
export async function getGroupMembers() {
  const session = await getSession();
  if (!session) return [];

  const account = await prisma.account.findUnique({
    where: { id: session.userId },
  });

  if (!account) return [];

  const members = await prisma.account.findMany({
    where: { groupId: account.groupId },
    select: {
      id: true,
      name: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return members;
}
