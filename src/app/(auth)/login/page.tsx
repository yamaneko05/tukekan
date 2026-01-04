import { redirect } from "next/navigation";
import { getSession } from "@/actions/auth";
import prisma from "@/lib/prisma";
import { LoginForm } from "./login-form";
import Image from "next/image";

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect("/");
  }

  const users = await prisma.account.findMany({
    select: {
      id: true,
      name: true,
      group: {
        select: {
          name: true,
        },
      },
    },
    orderBy: [{ group: { name: "asc" } }, { name: "asc" }],
  });

  const usersWithGroup = users.map((u) => ({
    id: u.id,
    name: u.name,
    groupName: u.group.name,
  }));

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-1 mb-8">
          <Image src={"/icon-192.png"} alt="icon" width={40} height={40} />
          <h1 className="text-3xl font-logo text-primary tracking-tight">
            <span className="text-[#e07326]">ツケ</span>カン
          </h1>
        </div>
        <LoginForm users={usersWithGroup} />
      </div>
    </div>
  );
}
