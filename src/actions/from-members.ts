"use server";

import prisma from "@/lib/prisma";
import { getSession } from "./auth";

export type MemberBalanceForMe = {
  memberId: string;
  memberName: string;
  balance: number;
};

export type TransactionFromMember = {
  id: string;
  amount: number;
  description: string | null;
  date: Date;
  memberName: string;
  memberId: string;
};

/**
 * メンバーごとの残高を取得（自分宛ての取引のみ）
 * メンバーが「自分」に対して登録した取引の合計
 */
export async function getMemberBalancesForMe(): Promise<MemberBalanceForMe[]> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  // 自分のAccountIdに紐づくPartnerを持つTransactionを取得
  const transactions = await prisma.transaction.findMany({
    where: {
      partner: {
        linkedAccountId: session.userId,
      },
    },
    include: {
      owner: {
        select: { id: true, name: true },
      },
    },
  });

  // メンバーごとに集計
  const balanceMap = new Map<string, { name: string; balance: number }>();

  for (const t of transactions) {
    const existing = balanceMap.get(t.ownerId);
    if (existing) {
      existing.balance += t.amount;
    } else {
      balanceMap.set(t.ownerId, {
        name: t.owner.name,
        balance: t.amount,
      });
    }
  }

  const result: MemberBalanceForMe[] = Array.from(balanceMap.entries()).map(
    ([memberId, { name, balance }]) => ({
      memberId,
      memberName: name,
      balance,
    }),
  );

  // 残高の絶対値が大きい順にソート
  return result.sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));
}

/**
 * 自分宛ての全取引履歴を取得
 */
export async function getTransactionsForMe(): Promise<TransactionFromMember[]> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const transactions = await prisma.transaction.findMany({
    where: {
      partner: {
        linkedAccountId: session.userId,
      },
    },
    orderBy: { date: "desc" },
    include: {
      owner: {
        select: { id: true, name: true },
      },
    },
  });

  return transactions.map((t) => ({
    id: t.id,
    amount: t.amount,
    description: t.description,
    date: t.date,
    memberName: t.owner.name,
    memberId: t.owner.id,
  }));
}

/**
 * 合計残高を取得
 */
export async function getTotalBalanceForMe(): Promise<number> {
  const balances = await getMemberBalancesForMe();
  return balances.reduce((sum, b) => sum + b.balance, 0);
}
