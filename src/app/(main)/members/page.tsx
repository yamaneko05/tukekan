import { redirect } from "next/navigation";
import { getSession } from "@/actions/auth";
import { getMembers } from "@/actions/member";
import { MemberList } from "@/components/features/member/member-list";

export default async function MembersPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const members = await getMembers();

  return (
    <div className="flex flex-col">
      <div className="p-4">
        <h2 className="text-xl font-semibold">メンバー</h2>
      </div>
      <div className="px-4">
        <MemberList members={members} />
      </div>
    </div>
  );
}
