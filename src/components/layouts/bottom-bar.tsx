"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet, ArrowDownToLine, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/",
    label: "自分",
    icon: Wallet,
  },
  {
    href: "/from-members",
    label: "相手から",
    icon: ArrowDownToLine,
  },
  {
    href: "/group",
    label: "グループ",
    icon: Building2,
  },
];

export function BottomBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background">
      <div className="mx-auto flex h-16 max-w-2xl items-center justify-around">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
