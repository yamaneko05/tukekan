"use server";

import prisma from "@/lib/prisma";
import { getSession } from "./auth";

export type MemberWithBalance = {
  id: string;
  name: string;
  totalBalance: number;
};

export type MemberPartnerBalance = {
  partnerId: string;
  partnerName: string;
  balance: number;
};

export type MemberDashboard = {
  id: string;
  name: string;
  totalBalance: number;
  partnerBalances: MemberPartnerBalance[];
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

export async function getMemberDashboard(
  memberId: string
): Promise<MemberDashboard | null> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const member = await prisma.account.findUnique({
    where: { id: memberId },
    select: {
      id: true,
      name: true,
    },
  });

  if (!member) {
    return null;
  }

  // そのメンバーの相手ごとの残高を取得
  const balances = await prisma.transaction.groupBy({
    by: ["partnerId"],
    where: { ownerId: memberId },
    _sum: { amount: true },
  });

  const partnerBalances = await Promise.all(
    balances.map(async (b) => {
      const partner = await prisma.partner.findUnique({
        where: { id: b.partnerId },
      });
      return {
        partnerId: b.partnerId,
        partnerName: partner?.name ?? "不明",
        balance: b._sum.amount ?? 0,
      };
    })
  );

  // 残高の絶対値が大きい順にソート
  const sortedBalances = partnerBalances.sort(
    (a, b) => Math.abs(b.balance) - Math.abs(a.balance)
  );

  const totalBalance = sortedBalances.reduce((sum, b) => sum + b.balance, 0);

  return {
    id: member.id,
    name: member.name,
    totalBalance,
    partnerBalances: sortedBalances,
  };
}
