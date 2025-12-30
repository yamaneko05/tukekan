"use client";

import { useState, useTransition } from "react";
import { regenerateInviteCode } from "@/actions/group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check, RefreshCw, Users } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

type Props = {
  group: {
    id: string;
    name: string;
    inviteCode: string;
  };
  isAdmin: boolean;
};

export function GroupSection({ group, isAdmin }: Props) {
  const [inviteCode, setInviteCode] = useState(group.inviteCode);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/invite/${inviteCode}`
      : `/invite/${inviteCode}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    toast.success("コピーしました");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = () => {
    startTransition(async () => {
      const result = await regenerateInviteCode();
      if (result.success && result.newInviteCode) {
        setInviteCode(result.newInviteCode);
        toast.success("招待リンクを再生成しました");
      } else if (result.error) {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>グループ名</Label>
        <p className="text-sm">{group.name}</p>
      </div>

      <div className="space-y-2">
        <Label>招待リンク</Label>
        <div className="flex gap-2">
          <Input value={inviteUrl} readOnly className="text-xs" />
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopy}
            title="コピー"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          このリンクを共有して新しいメンバーを招待できます
        </p>
      </div>

      {isAdmin && (
        <div className="space-y-3 pt-2 border-t">
          <p className="text-xs text-muted-foreground">管理者メニュー</p>

          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerate}
              disabled={isPending}
              className="justify-start"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isPending ? "animate-spin" : ""}`}
              />
              招待リンクを再生成
            </Button>

            <Button variant="outline" size="sm" asChild className="justify-start">
              <Link href="/settings/members">
                <Users className="h-4 w-4 mr-2" />
                メンバー管理
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
