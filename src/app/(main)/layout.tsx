import { Header } from "@/components/layouts/header";
import { BottomBar } from "@/components/layouts/bottom-bar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pb-16">{children}</main>
      <BottomBar />
    </div>
  );
}
