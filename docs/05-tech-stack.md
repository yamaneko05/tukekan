# 5. 技術スタック・ディレクトリ構成

## 5.1 技術スタック

| カテゴリ | 技術 | 選定理由 |
|----------|------|----------|
| Framework | Next.js 16 (App Router) | SSR/SSG対応、Server Components/Actions活用 |
| Language | TypeScript | 型安全性、開発効率 |
| UI | Tailwind CSS + shadcn/ui | 高速開発、一貫したデザイン |
| Database | Supabase (PostgreSQL) | マネージドDB、スケーラビリティ |
| ORM | Prisma 7 | 型安全なDB操作 |
| Auth | 自前実装（bcrypt + JWT） | シンプルな要件に適合、依存を減らす |
| Hosting | Vercel | Next.jsとの親和性 |

---

## 5.2 ディレクトリ構成

Server Components と Server Actions のみで実装。API Routesは使用しない。

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # 認証グループ（未ログイン）
│   │   └── login/
│   │       └── page.tsx
│   ├── (main)/                   # メイン機能グループ（ログイン必須）
│   │   ├── layout.tsx            # 共通レイアウト（ヘッダー、ボトムバー、FAB）
│   │   ├── page.tsx              # ホーム（残高 + 履歴タブ）
│   │   ├── members/
│   │   │   ├── page.tsx          # メンバー一覧
│   │   │   └── [id]/
│   │   │       └── page.tsx      # 他ユーザーダッシュボード
│   │   ├── partners/
│   │   │   └── [id]/
│   │   │       └── page.tsx      # 取引履歴
│   │   └── settings/
│   │       └── page.tsx          # 設定
│   └── layout.tsx                # ルートレイアウト
├── actions/                      # Server Actions
│   ├── auth.ts                   # ログイン、ログアウト、セッション取得
│   ├── transaction.ts            # 取引の作成
│   ├── partner.ts                # 相手の作成
│   └── member.ts                 # メンバー取得
├── components/
│   ├── ui/                       # shadcn/ui コンポーネント
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   ├── combobox.tsx
│   │   └── ...
│   ├── features/                 # 機能別コンポーネント
│   │   ├── transaction/
│   │   │   ├── transaction-form.tsx      # 取引登録フォーム
│   │   │   ├── transaction-list.tsx      # 取引一覧
│   │   │   └── transaction-item.tsx      # 取引アイテム
│   │   ├── partner/
│   │   │   ├── partner-select.tsx        # 相手選択コンボボックス
│   │   │   └── partner-balance-list.tsx  # 残高一覧
│   │   └── member/
│   │       └── member-list.tsx           # メンバー一覧
│   └── layouts/
│       ├── header.tsx
│       ├── bottom-bar.tsx                # ボトムバーナビゲーション
│       └── fab.tsx
├── lib/
│   ├── prisma.ts                 # Prismaクライアント
│   ├── auth.ts                   # JWT検証・生成、セッション管理
│   ├── password.ts               # bcryptハッシュ化
│   └── utils.ts                  # 汎用ユーティリティ
├── types/
│   └── index.ts                  # 共通型定義
└── prisma/
    ├── schema.prisma
    └── seed.ts                   # 初期ユーザー作成
```

---

## 5.3 Server Actions の設計

全ての書き込み操作と認証操作は Server Actions で実装する。

### 認証関連 (`actions/auth.ts`)

```typescript
'use server'
import { cookies } from 'next/headers'

// ログイン
export async function login(formData: FormData) {
  const name = formData.get('name') as string
  const password = formData.get('password') as string

  // 認証処理...
  const token = generateJWT(...)

  cookies().set('token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 90, // 90日
  })

  redirect('/')
}

// ログアウト
export async function logout() {
  cookies().delete('token')
  redirect('/login')
}

// セッション取得
export async function getSession() {
  const token = cookies().get('token')?.value
  if (!token) return null
  return verifyJWT(token)
}
```

### 取引関連 (`actions/transaction.ts`)

```typescript
'use server'

export async function createTransaction(formData: FormData) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  // 取引作成処理...
  revalidatePath('/')
}
```

---

## 5.4 データ取得の設計

読み取り操作は Server Components で直接 Prisma を呼び出す。

```typescript
// app/(main)/page.tsx
import { prisma } from '@/lib/prisma'
import { getSession } from '@/actions/auth'

export default async function HomePage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const balances = await prisma.transaction.groupBy({
    by: ['partnerId'],
    where: { ownerId: session.userId },
    _sum: { amount: true },
  })

  return <PartnerBalanceList balances={balances} />
}
```

---

## 5.5 初期ユーザーの作成

MVPでは新規登録画面がないため、seedスクリプトで初期ユーザーを作成する。

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('password123', 12)

  await prisma.account.createMany({
    data: [
      { name: 'user1', passwordHash },
      { name: 'user2', passwordHash },
      { name: 'user3', passwordHash },
    ],
  })
}

main()
```
