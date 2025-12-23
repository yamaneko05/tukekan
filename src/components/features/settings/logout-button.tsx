"use client";

import { logout } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2 } from "lucide-react";
import { useTransition } from "react";

export function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logout();
    });
  };

  return (
    <Button
      variant="destructive"
      onClick={handleLogout}
      disabled={isPending}
      className="w-full"
    >
      {isPending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          ログアウト中...
        </>
      ) : (
        <>
          <LogOut className="h-4 w-4" />
          ログアウト
        </>
      )}
    </Button>
  );
}
