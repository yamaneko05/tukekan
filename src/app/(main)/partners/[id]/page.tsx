import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getSession } from "@/actions/auth";
import { getPartners } from "@/actions/partner";
import { getDescriptionSuggestions } from "@/actions/transaction";
import prisma from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TransactionList,
  type Transaction,
} from "@/components/features/transaction/transaction-list";
import { TransactionModal } from "@/components/features/transaction/transaction-modal";

type Props = {
  params: Promise<{ id: string }>;
};

async function getPartnerWithTransactions(partnerId: string, userId: string) {
  const partner = await prisma.partner.findUnique({
    where: { id: partnerId },
  });

  if (!partner || partner.ownerId !== userId) {
    return null;
  }

  const transactions = await prisma.transaction.findMany({
    where: {
      ownerId: userId,
      partnerId: partnerId,
    },
    orderBy: { date: "desc" },
  });

  const balance = transactions.reduce((sum, t) => sum + t.amount, 0);

  return {
    partner,
    transactions,
    balance,
  };
}

export default async function PartnerHistoryPage({ params }: Props) {
  const { id } = await params;
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const data = await getPartnerWithTransactions(id, session.userId);
  if (!data) {
    notFound();
  }

  const { partner, transactions, balance } = data;

  const [partners, suggestions] = await Promise.all([
    getPartners(),
    getDescriptionSuggestions(),
  ]);

  const transactionItems: Transaction[] = transactions.map((t) => ({
    id: t.id,
    amount: t.amount,
    description: t.description,
    date: t.date,
  }));

  return (
    <div className="flex flex-col">
      <TransactionModal
        partners={partners}
        suggestions={suggestions}
        defaultPartnerId={id}
      />

      {/* Back button and title */}
      <div className="flex items-center gap-2 px-4 py-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/">
            <ChevronLeft className="h-5 w-5" />
            <span className="sr-only">戻る</span>
          </Link>
        </Button>
        <h2 className="text-lg font-semibold">{partner.name}</h2>
      </div>

      {/* Balance display */}
      <div className="px-4 py-6 text-center">
        <p className="text-sm text-muted-foreground">現在の残高</p>
        <p
          className={cn(
            "mt-2 text-3xl font-bold tabular-nums",
            balance < 0 ? "text-destructive" : "text-foreground"
          )}
        >
          {balance < 0 ? "-" : ""}¥{Math.abs(balance).toLocaleString()}
        </p>
      </div>

      {/* Transaction history */}
      <Card className="mx-4 rounded-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">取引履歴</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <TransactionList transactions={transactionItems} />
        </CardContent>
      </Card>
    </div>
  );
}
