"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Transaction } from "./transaction-list";
import { formatDateForDisplay } from "@/lib/dateUtils";

type Props = {
  transactions: Transaction[];
  partnerName: string;
};

function formatAmount(amount: number): string {
  const sign = amount > 0 ? "+" : "";
  return `${sign}¥${Math.abs(amount).toLocaleString()}`;
}

function formatBalance(balance: number): string {
  return `¥${Math.abs(balance).toLocaleString()}${balance < 0 ? " (借)" : ""}`;
}

export function CopyTransactionHistoryButton({
  transactions,
  partnerName,
}: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    // Sort by date (oldest first) for export
    const sortedTransactions = [...transactions].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateA - dateB;
    });

    // Build TSV content with header
    const header = ["日付", "相手", "説明", "金額", "残高"].join("\t");
    const rows = sortedTransactions.map((t) => {
      return [
        formatDateForDisplay(t.date),
        partnerName,
        t.description || "",
        formatAmount(t.amount),
        t.balanceAfter !== undefined ? formatBalance(t.balanceAfter) : "",
      ].join("\t");
    });

    const content = [header, ...rows].join("\n");

    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success("履歴をコピーしました");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("コピーに失敗しました");
    }
  };

  if (transactions.length === 0) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className="gap-2"
      disabled={copied}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          コピーしました
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          履歴をコピー
        </>
      )}
    </Button>
  );
}
