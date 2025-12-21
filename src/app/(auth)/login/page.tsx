import { redirect } from "next/navigation";
import { getSession } from "@/actions/auth";
import { prisma } from "@/lib/prisma";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect("/");
  }

  const users = await prisma.account.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">ツケカン</h1>
          <p className="text-muted-foreground mt-2">貸し借り管理アプリ</p>
        </div>
        <LoginForm users={users} />
      </div>
    </div>
  );
}
