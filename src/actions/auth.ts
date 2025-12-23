"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import {
  generateJWT,
  setSessionCookie,
  deleteSessionCookie,
  getSession,
} from "@/lib/auth";

const loginSchema = z.object({
  userId: z.string().min(1, "ユーザーを選択してください"),
  password: z.string().min(1, "パスワードを入力してください"),
});

export type LoginState = {
  error?: string;
};

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const result = loginSchema.safeParse({
    userId: formData.get("userId"),
    password: formData.get("password"),
  });

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const { userId, password } = result.data;

  const account = await prisma.account.findUnique({
    where: { id: userId },
  });

  if (!account) {
    return { error: "ユーザー名またはパスワードが正しくありません" };
  }

  const isValid = await verifyPassword(password, account.passwordHash);
  if (!isValid) {
    return { error: "ユーザー名またはパスワードが正しくありません" };
  }

  const token = await generateJWT({
    userId: account.id,
    name: account.name,
  });

  await setSessionCookie(token);
  redirect("/");
}

export async function logout(): Promise<void> {
  await deleteSessionCookie();
  redirect("/login");
}

// ユーザー情報取得
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  const account = await prisma.account.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, createdAt: true },
  });

  return account;
}

// プロフィール更新
const updateProfileSchema = z.object({
  name: z
    .string()
    .min(1, "ユーザー名を入力してください")
    .max(50, "ユーザー名は50文字以内で入力してください"),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
});

export type UpdateProfileState = {
  success?: boolean;
  error?: string;
};

export async function updateProfile(
  _prevState: UpdateProfileState,
  formData: FormData
): Promise<UpdateProfileState> {
  const session = await getSession();
  if (!session) {
    return { error: "ログインが必要です" };
  }

  const result = updateProfileSchema.safeParse({
    name: formData.get("name"),
    currentPassword: formData.get("currentPassword") || undefined,
    newPassword: formData.get("newPassword") || undefined,
  });

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const { name, currentPassword, newPassword } = result.data;

  // 名前の重複チェック（自分以外）
  const existingAccount = await prisma.account.findFirst({
    where: {
      name,
      id: { not: session.userId },
    },
  });

  if (existingAccount) {
    return { error: "このユーザー名は既に使用されています" };
  }

  // パスワード変更がある場合
  if (newPassword) {
    if (!currentPassword) {
      return { error: "現在のパスワードを入力してください" };
    }

    if (newPassword.length < 6) {
      return { error: "新しいパスワードは6文字以上で入力してください" };
    }

    const account = await prisma.account.findUnique({
      where: { id: session.userId },
    });

    if (!account) {
      return { error: "アカウントが見つかりません" };
    }

    const isValid = await verifyPassword(currentPassword, account.passwordHash);
    if (!isValid) {
      return { error: "現在のパスワードが正しくありません" };
    }

    const newPasswordHash = await hashPassword(newPassword);
    await prisma.account.update({
      where: { id: session.userId },
      data: { name, passwordHash: newPasswordHash },
    });
  } else {
    await prisma.account.update({
      where: { id: session.userId },
      data: { name },
    });
  }

  // セッションを更新（名前が変わった場合）
  const token = await generateJWT({
    userId: session.userId,
    name,
  });
  await setSessionCookie(token);

  return { success: true };
}

export { getSession };
