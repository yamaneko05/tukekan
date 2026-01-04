"use client";

import { useState, useTransition } from "react";
import { regenerateInviteCode } from "@/actions/group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check, RefreshCw } from "lucide-react";
import { toast } from "sonner";

type Props = {
  inviteCode: string;
  isAdmin: boolean;
};

export function InviteLinkSection({ inviteCode: initialCode, isAdmin }: Props) {
  const [inviteCode, setInviteCode] = useState(initialCode);
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
    <div className="space-y-3">
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

      {isAdmin && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleRegenerate}
          disabled={isPending}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isPending ? "animate-spin" : ""}`}
          />
          招待リンクを再生成
        </Button>
      )}
    </div>
  );
}
