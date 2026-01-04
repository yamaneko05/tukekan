import { getSession } from "@/actions/auth";
import prisma from "@/lib/prisma";
import { Header } from "@/components/layouts/header";
import { BottomBar } from "@/components/layouts/bottom-bar";

async function getUserName() {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.account.findUnique({
    where: { id: session.userId },
    select: { name: true },
  });
  return user?.name ?? null;
}

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userName = await getUserName();

  return (
    <div className="flex min-h-screen flex-col">
      <Header userName={userName} />
      <main className="mx-auto w-full max-w-2xl flex-1 pb-16">{children}</main>
      <BottomBar />
    </div>
  );
}
