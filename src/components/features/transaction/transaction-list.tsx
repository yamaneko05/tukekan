import { cn } from "@/lib/utils";

export type Transaction = {
  id: string;
  amount: number;
  description: string | null;
  date: Date;
  partnerName?: string;
};

type Props = {
  transactions: Transaction[];
  showPartnerName?: boolean;
};

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function TransactionList({ transactions, showPartnerName = false }: Props) {
  if (transactions.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        取引履歴がありません
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
          <span
            className={cn(
              "font-semibold tabular-nums",
              transaction.amount < 0 ? "text-destructive" : "text-foreground"
            )}
          >
            {transaction.amount > 0 ? "+" : ""}¥
            {Math.abs(transaction.amount).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}
