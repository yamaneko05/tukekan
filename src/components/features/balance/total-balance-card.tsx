import { cn } from "@/lib/utils";

type Props = {
  balance: number;
};

export function TotalBalanceCard({ balance }: Props) {
  return (
    <div className="p-4 text-center">
      <p className="text-sm text-muted-foreground">あなたの貸借残高</p>
      <p
        className={cn(
          "mt-2 text-3xl font-bold tabular-nums",
          balance < 0 ? "text-destructive" : "text-foreground"
        )}
      >
        {balance < 0 ? "-" : ""}¥{Math.abs(balance).toLocaleString()}
      </p>
    </div>
  );
}
