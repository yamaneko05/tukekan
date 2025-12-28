/**
 * 既存アカウントをグループに移行するスクリプト
 *
 * 実行方法:
 * npx tsx prisma/migrations/migrate-to-groups.ts
 *
 * 注意: このスクリプトはスキーママイグレーション後に一度だけ実行してください
 */

import { PrismaClient } from "../../src/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createId } from "@paralleldrive/cuid2";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("Starting migration to groups...");

  // groupIdがnullのアカウントを取得（未移行のアカウント）
  const accounts = await prisma.$queryRaw<{ id: string; name: string }[]>`
    SELECT id, name FROM "Account" WHERE "groupId" IS NULL
  `;

  if (accounts.length === 0) {
    console.log("No accounts to migrate.");
    return;
  }

  console.log(`Found ${accounts.length} accounts to migrate.`);

  for (const account of accounts) {
    const inviteCode = createId();

    // 各アカウントに個別のデフォルトグループを作成
    const group = await prisma.group.create({
      data: {
        name: `${account.name}のグループ`,
        inviteCode,
      },
    });

    // アカウントをグループに紐付け、ADMIN権限を付与
    await prisma.$executeRaw`
      UPDATE "Account"
      SET "groupId" = ${group.id}, "role" = 'ADMIN'
      WHERE id = ${account.id}
    `;

    console.log(`Migrated account "${account.name}" to group "${group.name}"`);
  }

  console.log("Migration completed successfully!");
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
