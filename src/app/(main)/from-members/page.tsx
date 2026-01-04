import { redirect } from "next/navigation";
import { getSession } from "@/actions/auth";
import {
  getMemberBalancesForMe,
  getTransactionsForMe,
  getTotalBalanceForMe,
} from "@/actions/from-members";
import { TotalBalanceCard } from "@/components/features/balance/total-balance-card";
import { MemberBalanceForMeList } from "@/components/features/from-members/member-balance-for-me-list";
import { TransactionFromMemberList } from "@/components/features/from-members/transaction-from-member-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, History } from "lucide-react";

export default async function FromMembersPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const [memberBalances, transactions, totalBalance] = await Promise.all([
    getMemberBalancesForMe(),
    getTransactionsForMe(),
    getTotalBalanceForMe(),
  ]);

  return (
    <div className="flex flex-col">
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
          <TotalBalanceCard balance={totalBalance} label="相手が記録した残高" />

          <div className="p-4">
            <h4 className="font-semibold">メンバーごとの残高</h4>
            <p className="text-sm text-muted-foreground mt-1">
              メンバーがあなた宛てに記録した取引の合計です
            </p>
            <div className="mt-4">
              <MemberBalanceForMeList balances={memberBalances} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="px-4">
            <h4 className="font-semibold">メンバーからの取引履歴</h4>
            <p className="text-sm text-muted-foreground mt-1">
              メンバーがあなた宛てに記録した取引です（読み取り専用）
            </p>
            <div className="mt-4">
              <TransactionFromMemberList transactions={transactions} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
