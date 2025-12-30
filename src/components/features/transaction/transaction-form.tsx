"use client";

import { useActionState, useState, useEffect, startTransition } from "react";
import {
  createTransaction,
  type CreateTransactionState,
} from "@/actions/transaction";
import { createPartner, type CreatePartnerState } from "@/actions/partner";
import type { Partner } from "@/actions/partner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "@/components/ui/select";
import { toast } from "sonner";

type Props = {
  partners: Partner[];
  suggestions: string[];
  defaultPartnerId?: string;
  onSuccess?: () => void;
};

const initialTransactionState: CreateTransactionState = {};
const initialPartnerState: CreatePartnerState = {};

export function TransactionForm({
  partners,
  suggestions,
  defaultPartnerId,
  onSuccess,
}: Props) {
  const [transactionState, transactionAction, isTransactionPending] =
    useActionState(createTransaction, initialTransactionState);
  const [partnerState, partnerAction, isPartnerPending] = useActionState(
    createPartner,
    initialPartnerState,
  );

  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(
    defaultPartnerId ?? "",
  );
  const [isLending, setIsLending] = useState<boolean>(true);
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [date, setDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [showNewPartnerInput, setShowNewPartnerInput] =
    useState<boolean>(false);
  const [newPartnerName, setNewPartnerName] = useState<string>("");
  const [localPartners, setLocalPartners] = useState<Partner[]>(partners);

  // Handle successful partner creation
  useEffect(() => {
    if (partnerState.success && partnerState.partner) {
      setLocalPartners((prev) =>
        [...prev, partnerState.partner!].sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      );
      setSelectedPartnerId(partnerState.partner.id);
      setShowNewPartnerInput(false);
      setNewPartnerName("");
      toast.success(`${partnerState.partner.name}を追加しました`);
    }
  }, [partnerState.success, partnerState.partner]);

  // Handle successful transaction creation
  useEffect(() => {
    if (transactionState.success) {
      toast.success("取引を登録しました");
      onSuccess?.();
    }
  }, [transactionState.success, onSuccess]);

  const handlePartnerSelectChange = (value: string) => {
    if (value === "new") {
      setShowNewPartnerInput(true);
      setSelectedPartnerId("");
    } else {
      setShowNewPartnerInput(false);
      setSelectedPartnerId(value);
    }
  };

  const handleCreatePartner = () => {
    if (!newPartnerName.trim()) return;
    const formData = new FormData();
    formData.append("name", newPartnerName.trim());
    startTransition(() => partnerAction(formData));
  };

  const handleSuggestionClick = (suggestion: string) => {
    setDescription(suggestion);
  };

  const handleSubmit = (formData: FormData) => {
    // Calculate signed amount
    const rawAmount = parseInt(amount, 10);
    if (isNaN(rawAmount)) return;
    const signedAmount = isLending ? rawAmount : -rawAmount;
    formData.set("amount", signedAmount.toString());
    formData.set("partnerId", selectedPartnerId);
    formData.set("description", description);
    formData.set("date", date);
    startTransition(() => transactionAction(formData));
  };

  const isPending = isTransactionPending || isPartnerPending;

  return (
    <form action={handleSubmit} className="space-y-6">
      {transactionState.error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
          {transactionState.error}
        </div>
      )}
      {partnerState.error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
          {partnerState.error}
        </div>
      )}

      {/* Partner Selection */}
      <div className="space-y-2">
        <Label htmlFor="partner">相手</Label>
        {!showNewPartnerInput ? (
          <Select
            value={selectedPartnerId}
            onValueChange={handlePartnerSelectChange}
          >
            <SelectTrigger id="partner" className="w-full">
              <SelectValue placeholder="選択してください" />
            </SelectTrigger>
            <SelectContent>
              {localPartners.map((partner) => (
                <SelectItem key={partner.id} value={partner.id}>
                  {partner.name}
                </SelectItem>
              ))}
              {localPartners.length > 0 && <SelectSeparator />}
              <SelectItem value="new">+ 新しい相手を追加</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <div className="flex gap-2">
            <Input
              value={newPartnerName}
              onChange={(e) => setNewPartnerName(e.target.value)}
              placeholder="相手の名前を入力"
              disabled={isPartnerPending}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={handleCreatePartner}
              disabled={isPartnerPending || !newPartnerName.trim()}
            >
              {isPartnerPending ? "追加中..." : "追加"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowNewPartnerInput(false);
                setNewPartnerName("");
              }}
            >
              戻る
            </Button>
          </div>
        )}
      </div>

      {/* Amount */}
      <div className="space-y-2">
        <Label htmlFor="amount">金額</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            ¥
          </span>
          <Input
            id="amount"
            type="number"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="pl-7"
            placeholder="0"
            min={1}
            max={10000000}
            required
          />
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={isLending ? "default" : "outline"}
            onClick={() => setIsLending(true)}
            className="flex-1"
          >
            貸した (+)
          </Button>
          <Button
            type="button"
            variant={!isLending ? "default" : "outline"}
            onClick={() => setIsLending(false)}
            className="flex-1"
          >
            借りた・返済 (-)
          </Button>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">説明（任意）</Label>
        <Input
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="例: 麻雀、ランチ、返済"
          maxLength={100}
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
              >
                {suggestion}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Date */}
      <div className="space-y-2">
        <Label htmlFor="date">日付</Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          max={new Date().toISOString().split("T")[0]}
          required
        />
      </div>

      {/* Submit */}
      <Button
        type="submit"
        className="w-full"
        disabled={isPending || !selectedPartnerId || !amount}
      >
        {isTransactionPending ? "登録中..." : "登録"}
      </Button>
    </form>
  );
}
