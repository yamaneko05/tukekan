"use server";

import prisma from "@/lib/prisma";
import { getSession } from "./auth";

export type MemberWithBalance = {
  id: string;
  name: string;
  totalBalance: number;
};

export async function getMembers(): Promise<MemberWithBalance[]> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const members = await prisma.account.findMany({
    where: { id: { not: session.userId } },
    select: {
      id: true,
      name: true,
      transactions: {
        select: { amount: true },
      },
    },
  });

  const membersWithBalance = members.map((m) => ({
    id: m.id,
    name: m.name,
    totalBalance: m.transactions.reduce((sum, t) => sum + t.amount, 0),
  }));

  // 残高の絶対値が大きい順にソート
  return membersWithBalance.sort(
    (a, b) => Math.abs(b.totalBalance) - Math.abs(a.totalBalance)
  );
}
