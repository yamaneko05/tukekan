"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

export type Transaction = {
  id: string;
  amount: number;
  description: string | null;
  date: Date;
  partnerName?: string;
  partnerId?: string;
  balanceAfter?: number;
};

type Props = {
  transactions: Transaction[];
  showPartnerName?: boolean;
  linkToPartner?: boolean;
  onTransactionClick?: (transaction: Transaction) => void;
  showBalance?: boolean;
};

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function TransactionList({
  transactions,
  showPartnerName = false,
  linkToPartner = false,
  onTransactionClick,
  showBalance = false,
}: Props) {
  if (transactions.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        取引履歴がありません
      </div>
    );
  }

  return (
    <div className="divide-y">
      {transactions.map((transaction) => {
        const content = (
          <>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">
                {formatDate(transaction.date)}
              </span>
              <div className="flex items-center gap-2">
                {showPartnerName && transaction.partnerName && (
                  <span className="font-medium">{transaction.partnerName}</span>
                )}
                {transaction.description && (
                  <span className="text-muted-foreground">
                    {transaction.description}
                  </span>
                )}
                {!showPartnerName && !transaction.description && (
                  <span className="text-muted-foreground">-</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <span
                  className={cn(
                    "font-semibold tabular-nums",
                    transaction.amount < 0
                      ? "text-destructive"
                      : "text-foreground",
                  )}
                >
                  {transaction.amount > 0 ? "+" : ""}¥
                  {Math.abs(transaction.amount).toLocaleString()}
                </span>
                {showBalance && transaction.balanceAfter !== undefined && (
                  <p
                    className={cn(
                      "text-xs tabular-nums",
                      transaction.balanceAfter < 0
                        ? "text-destructive/70"
                        : "text-muted-foreground",
                    )}
                  >
                    残高 ¥{Math.abs(transaction.balanceAfter).toLocaleString()}
                    {transaction.balanceAfter < 0 && " (借)"}
                  </p>
                )}
              </div>
              {linkToPartner && transaction.partnerId && (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </>
        );

        if (linkToPartner && transaction.partnerId) {
          return (
            <Link
              key={transaction.id}
              href={`/partners/${transaction.partnerId}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
            >
              {content}
            </Link>
          );
        }

        // Clickable for editing
        if (onTransactionClick) {
          return (
            <button
              key={transaction.id}
              type="button"
              onClick={() => onTransactionClick(transaction)}
              className="flex items-center justify-between px-4 py-3 w-full text-left hover:bg-muted/50 transition-colors"
            >
              {content}
            </button>
          );
        }

        return (
          <div
            key={transaction.id}
            className="flex items-center justify-between px-4 py-3"
          >
            {content}
          </div>
        );
      })}
    </div>
  );
}
