import { redirect } from "next/navigation";
import Link from "next/link";
import { Settings } from "lucide-react";
import { getCurrentUser } from "@/actions/auth";
import { getGroupMembers } from "@/actions/group";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GroupNameForm } from "@/components/features/group/group-name-form";
import { InviteLinkSection } from "@/components/features/group/invite-link-section";
import { GroupMemberList } from "@/components/features/group/group-member-list";

export default async function GroupPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const members = await getGroupMembers();
  const isAdmin = user.role === "ADMIN";

  return (
    <div className="flex flex-col">
      <div className="p-4">
        <h2 className="text-xl font-semibold">グループ</h2>
      </div>

      <div className="px-4 pb-12 space-y-4">
        <Card>
          <CardHeader>
            <GroupNameForm
              currentName={user.group.name}
              isAdmin={isAdmin}
            />
          </CardHeader>
          <CardContent>
            <InviteLinkSection
              inviteCode={user.group.inviteCode}
              isAdmin={isAdmin}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>メンバー</CardTitle>
              <CardDescription>{members.length}人</CardDescription>
            </div>
            {isAdmin && (
              <Button variant="outline" size="sm" asChild>
                <Link href="/group/members">
                  <Settings className="h-4 w-4 mr-2" />
                  管理
                </Link>
              </Button>
            )}
          </CardHeader>
          <CardContent className="px-0">
            <GroupMemberList members={members} currentUserId={user.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
