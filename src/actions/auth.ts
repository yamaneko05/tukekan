"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
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

export { getSession };
