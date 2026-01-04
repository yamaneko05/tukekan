import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MemberBalanceForMe } from "@/actions/from-members";

type Props = {
  balances: MemberBalanceForMe[];
};

export function MemberBalanceForMeList({ balances }: Props) {
  if (balances.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        メンバーからの取引がまだありません
      </div>
    );
  }

  return (
    <div className="divide-y">
      {balances.map((item) => (
        <Link
          key={item.memberId}
          href={`/from-members/${item.memberId}`}
          className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-muted/50"
        >
          <span className="font-medium">{item.memberName}</span>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "font-semibold tabular-nums",
                item.balance < 0 ? "text-destructive" : "text-foreground",
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
