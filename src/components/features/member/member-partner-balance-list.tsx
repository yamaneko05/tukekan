import { cn } from "@/lib/utils";
import type { MemberPartnerBalance } from "@/actions/member";

type Props = {
  balances: MemberPartnerBalance[];
};

export function MemberPartnerBalanceList({ balances }: Props) {
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
        <div
          key={item.partnerId}
          className="flex items-center justify-between px-4 py-3"
        >
          <span className="font-medium">{item.partnerName}</span>
          <span
            className={cn(
              "font-semibold tabular-nums",
              item.balance < 0 ? "text-destructive" : "text-foreground",
            )}
          >
            {item.balance < 0 ? "-" : ""}¥
            {Math.abs(item.balance).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}
