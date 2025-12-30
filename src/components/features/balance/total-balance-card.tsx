import { cn } from "@/lib/utils";

type Props = {
  balance: number;
  label?: string;
};

export function TotalBalanceCard({
  balance,
  label = "あなたの貸借残高",
}: Props) {
  return (
    <div className="p-4 text-center">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-2 text-3xl font-bold tabular-nums",
          balance < 0 ? "text-destructive" : "text-foreground",
        )}
      >
        {balance < 0 ? "-" : ""}¥{Math.abs(balance).toLocaleString()}
      </p>
    </div>
  );
}
