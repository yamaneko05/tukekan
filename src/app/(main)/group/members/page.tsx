import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getCurrentUser } from "@/actions/auth";
import { getGroupMembers } from "@/actions/group";
import { Button } from "@/components/ui/button";
import { AdminMemberList } from "@/components/features/group/admin-member-list";

export default async function GroupMembersPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/group");
  }

  const members = await getGroupMembers();

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 p-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/group">
            <ChevronLeft className="h-5 w-5" />
            <span className="sr-only">戻る</span>
          </Link>
        </Button>
        <h2 className="text-xl font-semibold">メンバー管理</h2>
      </div>

      <div className="px-4 pb-12">
        <AdminMemberList members={members} currentUserId={user.id} />
      </div>
    </div>
  );
}
