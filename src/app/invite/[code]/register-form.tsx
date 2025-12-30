"use client";

import { useActionState } from "react";
import { registerWithInvite, type RegisterState } from "@/actions/group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  inviteCode: string;
  groupName: string;
};

const initialState: RegisterState = {};

export function RegisterForm({ inviteCode, groupName }: Props) {
  const [state, formAction, isPending] = useActionState(
    registerWithInvite,
    initialState,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">新規登録</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          <input type="hidden" name="inviteCode" value={inviteCode} />

          {state.error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {state.error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">ユーザー名</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="ユーザー名を入力"
              autoComplete="username"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">パスワード</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="6文字以上"
              autoComplete="new-password"
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "登録中..." : "登録してグループに参加"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
