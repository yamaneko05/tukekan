# 8. グループ機能設計

## 概要

1ユーザー1グループ方式を採用。ユーザーはグループに所属し、同じグループのメンバーとのみ貸借管理を行う。

---

## データ設計

### 新規テーブル

```prisma
model Group {
  id          String   @id @default(cuid())
  name        String
  inviteCode  String   @unique  // 招待コード（URLに使用）
  createdAt   DateTime @default(now())

  accounts    Account[]
}
```

### 既存テーブルの変更

```prisma
model Account {
  id           String   @id @default(cuid())
  name         String   // グループ内で一意に変更
  passwordHash String
  createdAt    DateTime @default(now())

  // 追加フィールド
  groupId      String
  group        Group    @relation(fields: [groupId], references: [id])
  role         Role     @default(MEMBER)  // 権限

  // Relations
  transactions    Transaction[]
  partners        Partner[]       @relation("OwnerPartners")
  linkedFrom      Partner[]       @relation("LinkedAccount")

  @@unique([groupId, name])  // グループ内で名前の重複を防ぐ
}

enum Role {
  ADMIN   // 管理者：招待コード再生成、メンバー削除可能
  MEMBER  // メンバー：通常操作のみ
}
```

---

## 権限管理

| 操作 | ADMIN | MEMBER |
|------|-------|--------|
| 取引の記録・編集・削除 | ○ | ○ |
| Partner作成・編集 | ○ | ○ |
| メンバー一覧閲覧 | ○ | ○ |
| 招待コード表示 | ○ | ○ |
| 招待コード再生成 | ○ | × |
| メンバー削除 | ○ | × |
| グループ名変更 | ○ | × |

---

## 招待リンク仕様

### 形式
```
https://example.com/invite/{inviteCode}
```

### 特徴
- **有効期限なし**: グループに紐づく永続的なコード
- **複数回使用可**: 何人でも参加可能
- **再生成可能**: 管理者がコードを再生成すると古いリンクは無効化

### フロー
1. グループ作成時に招待コードを自動生成
2. 管理者が招待リンクを共有
3. 新規ユーザーがリンクにアクセス
4. ユーザー名・パスワードを入力して登録
5. アカウント作成と同時にグループに参加
6. 既存メンバー全員と双方向でPartnerを自動作成

---

## メンバー参加時のPartner自動作成

### フロー

```
新メンバーCがグループ参加
  ↓
既存メンバー: A, B
  ↓
自動作成されるPartner:
  - Aに対して: Partner(name: "C", linkedAccountId: C.id)
  - Bに対して: Partner(name: "C", linkedAccountId: C.id)
  - Cに対して: Partner(name: "A", linkedAccountId: A.id)
  - Cに対して: Partner(name: "B", linkedAccountId: B.id)
```

### 実装

```typescript
async function createPartnersForNewMember(newAccountId: string, groupId: string) {
  const existingMembers = await prisma.account.findMany({
    where: { groupId, id: { not: newAccountId } },
  });

  const newAccount = await prisma.account.findUnique({
    where: { id: newAccountId },
  });

  const partnerData = existingMembers.flatMap((member) => [
    // 既存メンバーに新メンバーのPartnerを作成
    {
      name: newAccount.name,
      ownerId: member.id,
      linkedAccountId: newAccountId,
    },
    // 新メンバーに既存メンバーのPartnerを作成
    {
      name: member.name,
      ownerId: newAccountId,
      linkedAccountId: member.id,
    },
  ]);

  await prisma.partner.createMany({ data: partnerData });
}
```

---

## メンバー削除時の処理

### 方針
- Partner: linkedAccountIdをnullに更新（リンク解除）、Partner自体は残す
- Transaction: そのまま保持（履歴として残す）

### 理由
- 過去の取引履歴は重要なデータ
- Partner名は残るため、誰との取引だったか分かる
- 削除されたメンバーとの未精算残高も確認可能

### 実装

```typescript
async function removeMemberFromGroup(accountId: string) {
  // 他メンバーが持つ、削除対象へのPartnerリンクを解除
  await prisma.partner.updateMany({
    where: { linkedAccountId: accountId },
    data: { linkedAccountId: null },
  });

  // 削除対象が持つPartnerのリンクを解除
  await prisma.partner.updateMany({
    where: { ownerId: accountId },
    data: { linkedAccountId: null },
  });

  // アカウントを削除（またはグループから除外）
  await prisma.account.delete({ where: { id: accountId } });
}
```

---

## グループ作成フロー

### 既存ユーザーの場合
1. 設定画面から「グループを作成」
2. グループ名を入力
3. グループ作成（招待コード自動生成）、作成者はADMIN権限で所属
4. 招待リンクを共有してメンバーを招待

### 新規ユーザーの場合
1. 既存グループの招待リンク経由でアクセス
2. ユーザー名・パスワードを入力
3. アカウント作成と同時にグループに参加（MEMBER権限）
4. 既存メンバー全員と双方向でPartner自動作成

---

## マイグレーション計画

### 既存データへの対応

```typescript
// マイグレーションスクリプト
async function migrateExistingAccounts() {
  const accounts = await prisma.account.findMany();

  for (const account of accounts) {
    // 各アカウントに個別のデフォルトグループを作成
    const group = await prisma.group.create({
      data: {
        name: `${account.name}のグループ`,
        inviteCode: generateInviteCode(), // cuid等で生成
      },
    });

    // アカウントをグループに紐付け、ADMIN権限を付与
    await prisma.account.update({
      where: { id: account.id },
      data: {
        groupId: group.id,
        role: 'ADMIN',
      },
    });
  }
}
```

---

## 画面設計

### 追加・変更する画面

| 画面 | パス | 説明 |
|------|------|------|
| 招待リンク経由登録 | `/invite/[code]` | 招待リンクからの新規登録 |
| グループ設定 | `/settings/group` | グループ名変更、招待リンク表示・再生成、メンバー管理 |

### 設定画面の変更
- 「グループ」セクションを追加
- グループ名表示
- 招待リンク表示（全員）
- 管理者のみ: 招待コード再生成ボタン、メンバー管理リンク

### メンバー一覧画面の変更
- 管理者のみ: メンバー削除ボタンを表示

---

## 実装フェーズ

### Phase 3-1: 基盤
- [ ] Prismaスキーマ更新（Group追加、Account変更）
- [ ] マイグレーション実行
- [ ] 既存データのマイグレーションスクリプト

### Phase 3-2: 招待・登録
- [ ] 招待リンク経由の新規登録画面
- [ ] 新規登録 Server Action（Partner自動作成含む）

### Phase 3-3: 管理機能
- [ ] グループ設定画面
- [ ] 招待コード再生成機能
- [ ] メンバー削除機能

### Phase 3-4: 権限制御
- [ ] 各Server Actionに権限チェック追加
- [ ] UIでの権限に応じた表示制御
