import { redirect, notFound } from "next/navigation";
import { getSession } from "@/actions/auth";
import { getMemberDashboard } from "@/actions/member";
import { TotalBalanceCard } from "@/components/features/balance/total-balance-card";
import { MemberPartnerBalanceList } from "@/components/features/member/member-partner-balance-list";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function MemberDashboardPage({ params }: Props) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { id } = await params;
  const member = await getMemberDashboard(id);

  if (!member) {
    notFound();
  }

  return (
    <div className="flex flex-col">
      <div className="p-4">
        <h2 className="text-2xl font-semibold">{member.name}の貸借</h2>
      </div>

      <TotalBalanceCard
        balance={member.totalBalance}
        label={`${member.name}の貸借残高`}
      />

      <div className="p-4">
        <h4 className="font-semibold">相手ごとの残高</h4>
        <div className="mt-4">
          <MemberPartnerBalanceList balances={member.partnerBalances} />
        </div>
      </div>
    </div>
  );
}
