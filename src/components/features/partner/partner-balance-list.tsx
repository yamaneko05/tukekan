import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type PartnerBalance = {
  partnerId: string;
  partnerName: string;
  balance: number;
};

type Props = {
  balances: PartnerBalance[];
};

export function PartnerBalanceList({ balances }: Props) {
  if (balances.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        取引相手がまだ登録されていません
      </div>
    );
  }

  return (
    <div className="divide-y">
      {balances.map((item) => (
        <Link
          key={item.partnerId}
          href={`/partners/${item.partnerId}`}
          className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-muted/50 border"
        >
          <span className="font-medium">{item.partnerName}</span>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "font-semibold tabular-nums",
                item.balance < 0 ? "text-destructive" : "text-foreground"
              )}
            >
              {item.balance < 0 ? "-" : ""}¥
              {Math.abs(item.balance).toLocaleString()}
            </span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </div>
        </Link>
      ))}
    </div>
  );
}
