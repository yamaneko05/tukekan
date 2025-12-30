import "dotenv/config";
import { PrismaClient, Role } from "../src/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createId } from "@paralleldrive/cuid2";
import bcrypt from "bcryptjs";
import * as fs from "fs";
import * as path from "path";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

// CSVデータの型
type CsvRow = {
  date: Date;
  name: string;
  amount: number;
  description: string;
  repaymentDate: Date | null;
};

// 金額文字列をパース（"¥1,300" -> 1300, "-¥20,000" -> -20000）
function parseAmount(amountStr: string): number {
  const cleaned = amountStr.replace(/[¥,]/g, "");
  return parseInt(cleaned, 10);
}

// 日付文字列をパース（"2025/05/01" -> Date）
function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("/").map(Number);
  return new Date(year, month - 1, day);
}

// CSVを読み込んでパース
function parseCsv(filePath: string): CsvRow[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.trim().split("\n");

  // ヘッダーをスキップ
  const dataLines = lines.slice(1);

  return dataLines.map((line) => {
    // CSVパース（カンマ区切り、ダブルクォートを考慮）
    const matches = line.match(/(".*?"|[^,]+|(?<=,)(?=,))/g) || [];
    const fields = matches.map((f) => f.replace(/^"|"$/g, "").trim());

    const [dateStr, name, amountStr, description, repaymentDateStr] = fields;

    return {
      date: parseDate(dateStr),
      name: name,
      amount: parseAmount(amountStr),
      description: description || "",
      repaymentDate: repaymentDateStr ? parseDate(repaymentDateStr) : null,
    };
  });
}

async function main() {
  console.log("CSVインポートを開始します...\n");

  // CSVファイルを読み込む
  const csvPath = path.join(__dirname, "..", "貸借 - 貸借.csv");
  const rows = parseCsv(csvPath);
  console.log(`CSVから ${rows.length} 件のレコードを読み込みました\n`);

  // パートナー名のユニークリストを取得
  const partnerNames = [...new Set(rows.map((r) => r.name))];
  console.log(`パートナー: ${partnerNames.join(", ")}\n`);

  // 既存データをクリア
  console.log("既存データをクリア中...");
  await prisma.transaction.deleteMany();
  await prisma.partner.deleteMany();
  await prisma.account.deleteMany();
  await prisma.group.deleteMany();
  console.log("完了\n");

  // パスワードハッシュを生成
  const passwordHash = await bcrypt.hash("password", 10);

  // グループを作成
  const group = await prisma.group.create({
    data: {
      id: createId(),
      name: "原チャ",
      inviteCode: createId(),
    },
  });
  console.log(`グループ「${group.name}」を作成しました`);
  console.log(`招待コード: ${group.inviteCode}\n`);

  // だいちアカウントを作成（ADMIN）
  const daichi = await prisma.account.create({
    data: {
      id: createId(),
      name: "だいち",
      passwordHash,
      groupId: group.id,
      role: Role.ADMIN,
    },
  });
  console.log(`アカウント「${daichi.name}」を作成しました（ADMIN）`);

  // 他のメンバーアカウントを作成（MEMBER）
  const memberAccounts: Record<string, string> = {};
  for (const name of partnerNames) {
    const account = await prisma.account.create({
      data: {
        id: createId(),
        name,
        passwordHash,
        groupId: group.id,
        role: Role.MEMBER,
      },
    });
    memberAccounts[name] = account.id;
    console.log(`アカウント「${name}」を作成しました（MEMBER）`);
  }
  console.log("");

  // だいち用のパートナーを作成（各メンバーへのリンク付き）
  const daichiPartners: Record<string, string> = {};
  for (const name of partnerNames) {
    const partner = await prisma.partner.create({
      data: {
        id: createId(),
        name,
        ownerId: daichi.id,
        linkedAccountId: memberAccounts[name],
      },
    });
    daichiPartners[name] = partner.id;
  }
  console.log(`だいちのパートナーを ${partnerNames.length} 名作成しました`);

  // 各メンバー用のパートナー（だいちへのリンク）を作成
  for (const name of partnerNames) {
    await prisma.partner.create({
      data: {
        id: createId(),
        name: "だいち",
        ownerId: memberAccounts[name],
        linkedAccountId: daichi.id,
      },
    });
  }
  console.log(`各メンバーのパートナー（だいち）を作成しました\n`);

  // トランザクションを作成
  let transactionCount = 0;
  let repaymentCount = 0;

  for (const row of rows) {
    const partnerId = daichiPartners[row.name];

    // 元の取引を作成
    await prisma.transaction.create({
      data: {
        id: createId(),
        amount: row.amount,
        description: row.description || null,
        date: row.date,
        ownerId: daichi.id,
        partnerId,
      },
    });
    transactionCount++;

    // 返済日がある場合、相殺取引を作成
    if (row.repaymentDate) {
      await prisma.transaction.create({
        data: {
          id: createId(),
          amount: -row.amount, // 逆の金額で相殺
          description: "返済",
          date: row.repaymentDate,
          ownerId: daichi.id,
          partnerId,
        },
      });
      repaymentCount++;
    }
  }

  console.log(`取引を ${transactionCount} 件作成しました`);
  console.log(`返済取引を ${repaymentCount} 件作成しました`);
  console.log(`合計: ${transactionCount + repaymentCount} 件\n`);

  // 残高サマリーを表示
  console.log("=== 残高サマリー ===");
  const balances = await prisma.transaction.groupBy({
    by: ["partnerId"],
    where: { ownerId: daichi.id },
    _sum: { amount: true },
  });

  for (const b of balances) {
    const partner = await prisma.partner.findUnique({
      where: { id: b.partnerId },
    });
    const balance = b._sum.amount ?? 0;
    if (balance !== 0) {
      const status = balance > 0 ? "貸し" : "借り";
      console.log(
        `${partner?.name}: ${balance.toLocaleString()}円（${status}）`,
      );
    }
  }

  const totalBalance = balances.reduce(
    (sum, b) => sum + (b._sum.amount ?? 0),
    0,
  );
  console.log(`\n合計残高: ${totalBalance.toLocaleString()}円`);

  console.log("\nインポート完了！");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
