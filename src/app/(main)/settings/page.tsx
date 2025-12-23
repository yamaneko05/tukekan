import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/auth";
import { ProfileForm } from "@/components/features/settings/profile-form";
import { LogoutButton } from "@/components/features/settings/logout-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 p-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/">
            <ChevronLeft className="h-5 w-5" />
            <span className="sr-only">戻る</span>
          </Link>
        </Button>
        <h2 className="text-xl font-semibold">設定</h2>
      </div>

      <div className="px-4 pb-12 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>プロフィール</CardTitle>
            <CardDescription>
              ユーザー名やパスワードを変更できます
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm currentName={user.name} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>アカウント</CardTitle>
            <CardDescription>アカウントに関する操作を行います</CardDescription>
          </CardHeader>
          <CardContent>
            <LogoutButton />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
