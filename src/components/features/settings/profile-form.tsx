"use client";

import { useActionState } from "react";
import { updateProfile, type UpdateProfileState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Check } from "lucide-react";
import { useEffect, useState } from "react";

type ProfileFormProps = {
  currentName: string;
};

export function ProfileForm({ currentName }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState<
    UpdateProfileState,
    FormData
  >(updateProfile, {});
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (state.success) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [state.success]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">ユーザー名</Label>
        <Input
          id="name"
          name="name"
          type="text"
          defaultValue={currentName}
          required
        />
      </div>

      <div className="pt-4 border-t">
        <p className="text-sm text-muted-foreground mb-4">
          パスワードを変更する場合のみ入力してください
        </p>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">現在のパスワード</Label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">新しいパスワード</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              autoComplete="new-password"
            />
          </div>
        </div>
      </div>

      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      {showSuccess && (
        <p className="text-sm text-green-600 flex items-center gap-1">
          <Check className="h-4 w-4" />
          プロフィールを更新しました
        </p>
      )}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            更新中...
          </>
        ) : (
          "保存"
        )}
      </Button>
    </form>
  );
}
