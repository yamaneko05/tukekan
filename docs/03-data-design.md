# 3. データ設計

## 3.1 ER図（概念）

```
┌─────────────┐       ┌─────────────────┐
│   Account   │       │   Transaction   │
├─────────────┤       ├─────────────────┤
│ id (PK)     │──┐    │ id (PK)         │
│ name        │  │    │ amount          │
│ passwordHash│  │    │ description     │
│ createdAt   │  │    │ date            │
└─────────────┘  │    │ createdAt       │
                 │    │                 │
                 │    │ ownerId (FK)    │──> Account
┌─────────────┐  │    │ partnerId (FK)  │──> Partner
│   Partner   │  │    └─────────────────┘
├─────────────┤  │
│ id (PK)     │──┘
│ name        │
│ linkedAccountId (FK, nullable) ──> Account
│ ownerId (FK)│──> Account
│ createdAt   │
└─────────────┘

※ 将来拡張: Groupテーブルを追加し、Account・Transactionに紐付け
```

---

## 3.2 テーブル定義

### Account（認証ユーザー）

| カラム       | 型            | 説明                                       |
| ------------ | ------------- | ------------------------------------------ |
| id           | String (cuid) | 一意のID                                   |
| name         | String        | ユーザー名（ログイン用・表示用、ユニーク） |
| passwordHash | String        | bcryptでハッシュ化されたパスワード         |
| createdAt    | DateTime      | 作成日時                                   |

### Partner（貸借相手）

ユーザーが管理する「貸借相手」。アプリ未登録の友人も登録可能。

| カラム          | 型            | 説明                          |
| --------------- | ------------- | ----------------------------- |
| id              | String (cuid) | 一意のID                      |
| name            | String        | 相手の名前                    |
| linkedAccountId | String?       | 紐付いたAccountのID（任意）   |
| ownerId         | String        | この相手を登録したAccountのID |
| createdAt       | DateTime      | 作成日時                      |

### Transaction（取引）

金額の正負で貸し借りを区別。返済も借りもマイナス金額で記録（descriptionで区別可能）。

| カラム      | 型            | 説明                            |
| ----------- | ------------- | ------------------------------- |
| id          | String (cuid) | 一意のID                        |
| amount      | Int           | 金額（+は貸し、-は借り/返済）   |
| description | String?       | 備考（麻雀、ドライブ、返済 等） |
| date        | DateTime      | 取引発生日                      |
| ownerId     | String        | 取引を登録したAccountのID       |
| partnerId   | String        | 相手（Partner）のID             |
| createdAt   | DateTime      | 作成日時                        |

---

## 3.3 Prisma Schema

```prisma
model Account {
  id           String   @id @default(cuid())
  name         String   @unique  // ログイン用・表示用
  passwordHash String
  createdAt    DateTime @default(now())

  // Relations
  transactions Transaction[]
  partners     Partner[]     @relation("OwnerPartners")
  linkedFrom   Partner[]     @relation("LinkedAccount")
}

model Partner {
  id              String   @id @default(cuid())
  name            String
  createdAt       DateTime @default(now())

  // Relations
  ownerId         String
  owner           Account  @relation("OwnerPartners", fields: [ownerId], references: [id])

  linkedAccountId String?
  linkedAccount   Account? @relation("LinkedAccount", fields: [linkedAccountId], references: [id])

  transactions    Transaction[]

  @@unique([ownerId, name]) // 同一オーナー内で名前の重複を防ぐ
}

model Transaction {
  id          String   @id @default(cuid())
  amount      Int      // +は貸し、-は借り/返済
  description String?
  date        DateTime @default(now())
  createdAt   DateTime @default(now())

  // Relations
  ownerId     String
  owner       Account  @relation(fields: [ownerId], references: [id])

  partnerId   String
  partner     Partner  @relation(fields: [partnerId], references: [id])

  @@index([ownerId])
  @@index([partnerId])
  @@index([date])
}
```

---

## 3.4 データアクセスパターン（Prisma）

### 自分の相手ごとの貸借残高を取得

```typescript
const balances = await prisma.transaction.groupBy({
  by: ["partnerId"],
  where: { ownerId: currentUserId },
  _sum: { amount: true },
});

// Partner情報と結合
const partnersWithBalance = await Promise.all(
  balances.map(async (b) => {
    const partner = await prisma.partner.findUnique({
      where: { id: b.partnerId },
    });
    return {
      partner,
      balance: b._sum.amount ?? 0,
    };
  }),
);
```

### 特定の相手との取引履歴を取得

```typescript
const transactions = await prisma.transaction.findMany({
  where: {
    ownerId: currentUserId,
    partnerId: partnerId,
  },
  orderBy: { date: "desc" },
  include: { partner: true },
});
```

### 自分の全取引履歴を取得

```typescript
const allTransactions = await prisma.transaction.findMany({
  where: { ownerId: currentUserId },
  orderBy: { date: "desc" },
  include: { partner: true },
});
```

### メンバー一覧（各ユーザーの総残高付き）を取得

```typescript
const members = await prisma.account.findMany({
  where: { id: { not: currentUserId } },
  select: {
    id: true,
    name: true,
    transactions: {
      select: { amount: true },
    },
  },
});

const membersWithBalance = members.map((m) => ({
  id: m.id,
  name: m.name,
  totalBalance: m.transactions.reduce((sum, t) => sum + t.amount, 0),
}));
```

### 説明のサジェスト（過去履歴から頻度順）

```typescript
const suggestions = await prisma.transaction.groupBy({
  by: ["description"],
  where: {
    ownerId: currentUserId,
    description: { not: null },
  },
  _count: { description: true },
  orderBy: { _count: { description: "desc" } },
  take: 10,
});
// → ["麻雀", "ドライブ", "ランチ", ...]
```
