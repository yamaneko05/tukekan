import { redirect, notFound } from "next/navigation";
import { getSession } from "@/actions/auth";
import { getGroupByInviteCode } from "@/actions/group";
import { RegisterForm } from "./register-form";

type Props = {
  params: Promise<{ code: string }>;
};

export default async function InvitePage({ params }: Props) {
  const { code } = await params;

  const session = await getSession();
  if (session) {
    redirect("/");
  }

  const group = await getGroupByInviteCode(code);
  if (!group) {
    notFound();
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">ツケカン</h1>
          <p className="text-muted-foreground mt-2">「{group.name}」に参加</p>
        </div>
        <RegisterForm inviteCode={code} groupName={group.name} />
      </div>
    </div>
  );
}
