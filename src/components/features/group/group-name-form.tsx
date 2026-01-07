"use client";

import { useActionState, useEffect, useState } from "react";
import { Pencil, Check, X, Loader2 } from "lucide-react";
import { updateGroupName, UpdateGroupNameState } from "@/actions/group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  currentName: string;
  isAdmin: boolean;
};

export function GroupNameForm({ currentName, isAdmin }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentName);
  const [state, formAction, isPending] = useActionState<
    UpdateGroupNameState,
    FormData
  >(updateGroupName, {});

  useEffect(() => {
    if (state.success) {
      setIsEditing(false);
    }
  }, [state.success]);

  const handleCancel = () => {
    setName(currentName);
    setIsEditing(false);
  };

  if (!isAdmin) {
    return (
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">グループ名</p>
        <p className="text-lg font-semibold">{currentName}</p>
      </div>
    );
  }

  if (!isEditing) {
    return (
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">グループ名</p>
        <div className="flex items-center gap-2">
          <p className="text-lg font-semibold">{currentName}</p>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="h-4 w-4" />
            <span className="sr-only">グループ名を編集</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">グループ名</p>
      <form action={formAction} className="flex items-center gap-2">
        <Input
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-9 text-lg font-semibold"
          disabled={isPending}
          autoFocus
        />
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-green-600 hover:text-green-700"
          disabled={isPending || name === currentName || name.trim() === ""}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          <span className="sr-only">保存</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={handleCancel}
          disabled={isPending}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">キャンセル</span>
        </Button>
      </form>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
    </div>
  );
}
