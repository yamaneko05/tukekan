"use client";

import { useState, useTransition } from "react";
import { removeMember } from "@/actions/group";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2, Shield, User, Loader2 } from "lucide-react";

type Member = {
  id: string;
  name: string;
  role: string;
  createdAt: Date;
};

type Props = {
  members: Member[];
  currentUserId: string;
};

export function MemberList({ members, currentUserId }: Props) {
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    if (!memberToDelete) return;

    startTransition(async () => {
      const result = await removeMember(memberToDelete.id);
      if (result.error) {
        setError(result.error);
      } else {
        setMemberToDelete(null);
        setError(null);
      }
    });
  };

  return (
    <>
      <div className="space-y-2">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between p-3 rounded-lg border"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                {member.role === "ADMIN" ? (
                  <Shield className="h-5 w-5 text-primary" />
                ) : (
                  <User className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="font-medium">{member.name}</p>
                <p className="text-xs text-muted-foreground">
                  {member.role === "ADMIN" ? "管理者" : "メンバー"}
                </p>
              </div>
            </div>

            {member.id !== currentUserId && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMemberToDelete(member)}
                title="メンバーを削除"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <Dialog
        open={!!memberToDelete}
        onOpenChange={(open) => {
          if (!open) {
            setMemberToDelete(null);
            setError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>メンバーを削除</DialogTitle>
            <DialogDescription>
              「{memberToDelete?.name}」をグループから削除しますか？
              <br />
              この操作は取り消せません。取引履歴は保持されます。
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMemberToDelete(null)}
              disabled={isPending}
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  削除中...
                </>
              ) : (
                "削除"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
