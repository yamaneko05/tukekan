import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getSession } from "@/actions/auth";
import { getTransactionsFromMember } from "@/actions/from-members";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TransactionFromMemberList } from "@/components/features/from-members/transaction-from-member-list";

type Props = {
  params: Promise<{ memberId: string }>;
};

export default async function FromMemberDetailPage({ params }: Props) {
  const { memberId } = await params;
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const data = await getTransactionsFromMember(memberId);
  if (!data) {
    notFound();
  }

  const { memberName, balance, transactions } = data;

  return (
    <div className="flex flex-col">
      {/* Back button and title */}
      <div className="flex items-center gap-2 px-4 py-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/from-members">
            <ChevronLeft className="h-5 w-5" />
            <span className="sr-only">戻る</span>
          </Link>
        </Button>
        <h2 className="text-lg font-semibold">{memberName}からの取引</h2>
      </div>

      {/* Balance display */}
      <div className="px-4 py-6 text-center">
        <p className="text-sm text-muted-foreground">
          {memberName}が記録した残高
        </p>
        <p
          className={cn(
            "mt-2 text-3xl font-bold tabular-nums",
            balance < 0 ? "text-destructive" : "text-foreground",
          )}
        >
          {balance < 0 ? "-" : ""}¥{Math.abs(balance).toLocaleString()}
        </p>
      </div>

      {/* Transaction history */}
      <div className="px-4">
        <h4 className="font-semibold">取引履歴</h4>
        <p className="text-sm text-muted-foreground mt-1">
          {memberName}があなた宛てに記録した取引です（読み取り専用）
        </p>
        <div className="mt-4">
          <TransactionFromMemberList transactions={transactions} />
        </div>
      </div>
    </div>
  );
}
