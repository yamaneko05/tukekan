import { redirect } from "next/navigation";
import { getSession } from "@/actions/auth";
import prisma from "@/lib/prisma";
import { getPartners } from "@/actions/partner";
import { getDescriptionSuggestions } from "@/actions/transaction";
import { TotalBalanceCard } from "@/components/features/balance/total-balance-card";
import {
  PartnerBalanceList,
  type PartnerBalance,
} from "@/components/features/partner/partner-balance-list";
import { TransactionModal } from "@/components/features/transaction/transaction-modal";
import { TransactionListWithEdit } from "@/components/features/transaction/transaction-list-with-edit";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, History } from "lucide-react";

async function getPartnerBalances(userId: string): Promise<PartnerBalance[]> {
  const balances = await prisma.transaction.groupBy({
    by: ["partnerId"],
    where: { ownerId: userId },
    _sum: { amount: true },
  });

  const partnersWithBalance = await Promise.all(
    balances.map(async (b) => {
      const partner = await prisma.partner.findUnique({
        where: { id: b.partnerId },
      });
      return {
        partnerId: b.partnerId,
        partnerName: partner?.name ?? "不明",
        balance: b._sum.amount ?? 0,
      };
    }),
  );

  // 残高の絶対値が大きい順にソート
  return partnersWithBalance.sort(
    (a, b) => Math.abs(b.balance) - Math.abs(a.balance),
  );
}

async function getAllTransactions(userId: string) {
  const transactions = await prisma.transaction.findMany({
    where: { ownerId: userId },
    orderBy: { date: "desc" },
    include: { partner: true },
  });

  return transactions.map((t) => ({
    id: t.id,
    amount: t.amount,
    description: t.description,
    date: t.date,
    partnerName: t.partner.name,
    partnerId: t.partnerId,
  }));
}

export default async function HomePage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const [partnerBalances, partners, suggestions, allTransactions] =
    await Promise.all([
      getPartnerBalances(session.userId),
      getPartners(),
      getDescriptionSuggestions(),
      getAllTransactions(session.userId),
    ]);
  const totalBalance = partnerBalances.reduce(
    (sum, item) => sum + item.balance,
    0,
  );

  return (
    <div className="flex flex-col">
      <TransactionModal partners={partners} suggestions={suggestions} />
      <Tabs defaultValue="balance" className="w-full">
        <div className="p-4">
          <TabsList className="w-full h-10">
            <TabsTrigger value="balance">
              <Wallet />
              残高
            </TabsTrigger>
            <TabsTrigger value="history">
              <History />
              履歴
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="balance">
          <TotalBalanceCard balance={totalBalance} />

          <div className="p-4">
            <h4 className="font-semibold">相手ごとの残高</h4>
            <div className="mt-4">
              <PartnerBalanceList balances={partnerBalances} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="px-4">
            <h4 className="font-semibold">全取引履歴</h4>
            <p className="text-sm text-muted-foreground mt-1">
              取引をクリックすると編集できます。
            </p>
            <div className="mt-4">
              <TransactionListWithEdit
                transactions={allTransactions}
                showPartnerName={true}
                suggestions={suggestions}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
