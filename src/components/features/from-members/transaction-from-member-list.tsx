"use client";

import { cn } from "@/lib/utils";
import { formatDateForDisplay } from "@/lib/dateUtils";
import type { TransactionFromMember } from "@/actions/from-members";

type Props = {
  transactions: TransactionFromMember[];
};

export function TransactionFromMemberList({ transactions }: Props) {
  if (transactions.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        メンバーからの取引がありません
      </div>
    );
  }

  return (
    <div className="divide-y">
      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          className="flex items-center justify-between px-4 py-3"
        >
          <div className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">
              {formatDateForDisplay(transaction.date)}
            </span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{transaction.memberName}</span>
              {transaction.description && (
                <span className="text-muted-foreground">
                  {transaction.description}
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <span
              className={cn(
                "font-semibold tabular-nums",
                transaction.amount < 0 ? "text-destructive" : "text-foreground",
              )}
            >
              {transaction.amount > 0 ? "+" : ""}¥
              {Math.abs(transaction.amount).toLocaleString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
