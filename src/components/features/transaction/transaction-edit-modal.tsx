"use client";

import { useState, useEffect, useTransition, useActionState, startTransition as reactStartTransition } from "react";
import {
  updateTransaction,
  deleteTransaction,
  type UpdateTransactionState,
} from "@/actions/transaction";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Transaction } from "./transaction-list";

type Props = {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestions?: string[];
};

const initialState: UpdateTransactionState = {};

export function TransactionEditModal({
  transaction,
  open,
  onOpenChange,
  suggestions = [],
}: Props) {
  const [state, formAction, isUpdatePending] = useActionState(
    updateTransaction,
    initialState
  );
  const [isDeletePending, startDeleteTransition] = useTransition();

  const [isLending, setIsLending] = useState<boolean>(true);
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Initialize form when transaction changes
  useEffect(() => {
    if (transaction) {
      const absAmount = Math.abs(transaction.amount);
      setIsLending(transaction.amount >= 0);
      setAmount(absAmount.toString());
      setDescription(transaction.description || "");
      setDate(new Date(transaction.date).toISOString().split("T")[0]);
      setShowDeleteConfirm(false);
      setDeleteError(null);
    }
  }, [transaction]);

  // Handle successful update
  useEffect(() => {
    if (state.success) {
      toast.success("取引を更新しました");
      onOpenChange(false);
    }
  }, [state.success, onOpenChange]);

  const handleSubmit = (formData: FormData) => {
    if (!transaction) return;
    const rawAmount = parseInt(amount, 10);
    if (isNaN(rawAmount)) return;
    const signedAmount = isLending ? rawAmount : -rawAmount;
    formData.set("transactionId", transaction.id);
    formData.set("amount", signedAmount.toString());
    formData.set("description", description);
    formData.set("date", date);
    reactStartTransition(() => formAction(formData));
  };

  const handleDelete = () => {
    if (!transaction) return;
    startDeleteTransition(async () => {
      const result = await deleteTransaction(transaction.id);
      if (result.error) {
        setDeleteError(result.error);
      } else {
        toast.success("取引を削除しました");
        onOpenChange(false);
      }
    });
  };

  const handleSuggestionClick = (suggestion: string) => {
    setDescription(suggestion);
  };

  const isPending = isUpdatePending || isDeletePending;

  if (!transaction) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>取引を編集</DialogTitle>
        </DialogHeader>

        {!showDeleteConfirm ? (
          <form action={handleSubmit} className="space-y-6">
            {state.error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {state.error}
              </div>
            )}

            {/* Partner (read-only) */}
            {transaction.partnerName && (
              <div className="space-y-2">
                <Label>相手</Label>
                <p className="text-sm py-2 px-3 bg-muted rounded-md">
                  {transaction.partnerName}
                </p>
              </div>
            )}

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="edit-amount">金額</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  ¥
                </span>
                <Input
                  id="edit-amount"
                  type="number"
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-7"
                  placeholder="0"
                  min={1}
                  max={10000000}
                  required
                  disabled={isPending}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={isLending ? "default" : "outline"}
                  onClick={() => setIsLending(true)}
                  className="flex-1"
                  disabled={isPending}
                >
                  貸した (+)
                </Button>
                <Button
                  type="button"
                  variant={!isLending ? "default" : "outline"}
                  onClick={() => setIsLending(false)}
                  className="flex-1"
                  disabled={isPending}
                >
                  借りた・返済 (-)
                </Button>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="edit-description">説明（任意）</Label>
              <Input
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="例: 麻雀、ランチ、返済"
                maxLength={100}
                disabled={isPending}
              />
              {suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion) => (
                    <Button
                      key={suggestion}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="h-7 text-xs"
                      disabled={isPending}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="edit-date">日付</Label>
              <Input
                id="edit-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                required
                disabled={isPending}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isPending}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isPending || !amount}
              >
                {isUpdatePending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    更新中...
                  </>
                ) : (
                  "更新"
                )}
              </Button>
            </div>
          </form>
        ) : (
          <>
            <DialogDescription>
              この取引を削除しますか？この操作は取り消せません。
            </DialogDescription>

            {deleteError && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {deleteError}
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeletePending}
              >
                キャンセル
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeletePending}
              >
                {isDeletePending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    削除中...
                  </>
                ) : (
                  "削除"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
