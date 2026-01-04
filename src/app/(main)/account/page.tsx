import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getCurrentUser } from "@/actions/auth";
import { ProfileForm } from "@/components/features/settings/profile-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function AccountPage() {
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
        <h2 className="text-xl font-semibold">アカウント設定</h2>
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
      </div>
    </div>
  );
}
