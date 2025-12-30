"use client";

import { useState } from "react";
import { TransactionList, type Transaction } from "./transaction-list";
import { TransactionEditModal } from "./transaction-edit-modal";

type Props = {
  transactions: Transaction[];
  showPartnerName?: boolean;
  linkToPartner?: boolean;
  suggestions?: string[];
};

export function TransactionListWithEdit({
  transactions,
  showPartnerName = false,
  linkToPartner = false,
  suggestions = [],
}: Props) {
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setEditModalOpen(true);
  };

  return (
    <>
      <TransactionList
        transactions={transactions}
        showPartnerName={showPartnerName}
        linkToPartner={linkToPartner}
        onTransactionClick={handleTransactionClick}
      />
      <TransactionEditModal
        transaction={selectedTransaction}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        suggestions={suggestions}
      />
    </>
  );
}
