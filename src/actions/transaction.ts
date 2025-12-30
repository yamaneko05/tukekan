"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function getDescriptionSuggestions(): Promise<string[]> {
  const session = await getSession();
  if (!session) {
    return [];
  }

  const suggestions = await prisma.transaction.groupBy({
    by: ["description"],
    where: {
      ownerId: session.userId,
      description: { not: null },
    },
    _count: { description: true },
    orderBy: { _count: { description: "desc" } },
    take: 10,
  });

  return suggestions
    .map((s) => s.description)
    .filter((d): d is string => d !== null);
}

const createTransactionSchema = z.object({
  partnerId: z.string().min(1, "相手を選択してください"),
  amount: z
    .number()
    .int("整数で入力してください")
    .min(-10000000, "金額は-1,000万円以上で入力してください")
    .max(10000000, "金額は1,000万円以下で入力してください")
    .refine((val) => val !== 0, "金額を入力してください"),
  description: z
    .string()
    .max(100, "説明は100文字以内で入力してください")
    .optional(),
  date: z
    .date()
    .refine((date) => date <= new Date(), "未来の日付は選択できません"),
});

export type CreateTransactionState = {
  error?: string;
  success?: boolean;
};

export async function createTransaction(
  _prevState: CreateTransactionState,
  formData: FormData,
): Promise<CreateTransactionState> {
  const session = await getSession();
  if (!session) {
    return { error: "ログインが必要です" };
  }

  // amountの解析
  const amountStr = formData.get("amount");
  const amount = amountStr ? parseInt(amountStr.toString(), 10) : NaN;

  // dateの解析
  const dateStr = formData.get("date");
  const date = dateStr ? new Date(dateStr.toString()) : new Date();

  const result = createTransactionSchema.safeParse({
    partnerId: formData.get("partnerId"),
    amount: isNaN(amount) ? undefined : amount,
    description: formData.get("description") || undefined,
    date: date,
  });

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const {
    partnerId,
    amount: validAmount,
    description,
    date: validDate,
  } = result.data;

  // partnerが存在し、かつ自分が所有しているかチェック
  const partner = await prisma.partner.findUnique({
    where: { id: partnerId },
  });

  if (!partner) {
    return { error: "指定された相手が見つかりません" };
  }

  if (partner.ownerId !== session.userId) {
    return { error: "この相手への取引を登録する権限がありません" };
  }

  await prisma.transaction.create({
    data: {
      amount: validAmount,
      description: description || null,
      date: validDate,
      ownerId: session.userId,
      partnerId: partnerId,
    },
  });

  revalidatePath("/");
  revalidatePath(`/partners/${partnerId}`);

  return { success: true };
}

// 取引更新
const updateTransactionSchema = z.object({
  transactionId: z.string().min(1, "取引IDが必要です"),
  amount: z
    .number()
    .int("整数で入力してください")
    .min(-10000000, "金額は-1,000万円以上で入力してください")
    .max(10000000, "金額は1,000万円以下で入力してください")
    .refine((val) => val !== 0, "金額を入力してください"),
  description: z
    .string()
    .max(100, "説明は100文字以内で入力してください")
    .optional(),
  date: z
    .date()
    .refine((date) => date <= new Date(), "未来の日付は選択できません"),
});

export type UpdateTransactionState = {
  error?: string;
  success?: boolean;
};

export async function updateTransaction(
  _prevState: UpdateTransactionState,
  formData: FormData,
): Promise<UpdateTransactionState> {
  const session = await getSession();
  if (!session) {
    return { error: "ログインが必要です" };
  }

  const amountStr = formData.get("amount");
  const amount = amountStr ? parseInt(amountStr.toString(), 10) : NaN;

  const dateStr = formData.get("date");
  const date = dateStr ? new Date(dateStr.toString()) : new Date();

  const result = updateTransactionSchema.safeParse({
    transactionId: formData.get("transactionId"),
    amount: isNaN(amount) ? undefined : amount,
    description: formData.get("description") || undefined,
    date: date,
  });

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const {
    transactionId,
    amount: validAmount,
    description,
    date: validDate,
  } = result.data;

  // 取引が存在し、自分のものかチェック
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
  });

  if (!transaction) {
    return { error: "取引が見つかりません" };
  }

  if (transaction.ownerId !== session.userId) {
    return { error: "この取引を編集する権限がありません" };
  }

  await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      amount: validAmount,
      description: description || null,
      date: validDate,
    },
  });

  revalidatePath("/");
  revalidatePath(`/partners/${transaction.partnerId}`);

  return { success: true };
}

// 取引削除
export type DeleteTransactionState = {
  error?: string;
  success?: boolean;
};

export async function deleteTransaction(
  transactionId: string,
): Promise<DeleteTransactionState> {
  const session = await getSession();
  if (!session) {
    return { error: "ログインが必要です" };
  }

  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
  });

  if (!transaction) {
    return { error: "取引が見つかりません" };
  }

  if (transaction.ownerId !== session.userId) {
    return { error: "この取引を削除する権限がありません" };
  }

  await prisma.transaction.delete({
    where: { id: transactionId },
  });

  revalidatePath("/");
  revalidatePath(`/partners/${transaction.partnerId}`);

  return { success: true };
}
