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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    })
  );

  // 残高の絶対値が大きい順にソート
  return partnersWithBalance.sort(
    (a, b) => Math.abs(b.balance) - Math.abs(a.balance)
  );
}

export default async function HomePage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const [partnerBalances, partners, suggestions] = await Promise.all([
    getPartnerBalances(session.userId),
    getPartners(),
    getDescriptionSuggestions(),
  ]);
  const totalBalance = partnerBalances.reduce(
    (sum, item) => sum + item.balance,
    0
  );

  return (
    <div className="flex flex-col">
      <TransactionModal partners={partners} suggestions={suggestions} />
      <Tabs defaultValue="balance" className="w-full">
        <div className="px-4 py-4">
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

        <TabsContent value="balance" className="mt-0">
          <TotalBalanceCard balance={totalBalance} />

          <Card className="mx-4 rounded-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">相手ごとの残高</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <PartnerBalanceList balances={partnerBalances} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-0">
          <div className="p-4">
            <p className="text-muted-foreground">
              履歴機能は次のフェーズで実装予定です。
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
