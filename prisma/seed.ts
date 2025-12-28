import { PrismaClient, Role } from "../src/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);

  // デフォルトグループを作成
  const group = await prisma.group.upsert({
    where: { inviteCode: "demo-invite-code" },
    update: {},
    create: {
      name: "デモグループ",
      inviteCode: "demo-invite-code",
    },
  });

  const users = [
    { name: "user1", passwordHash, groupId: group.id, role: Role.ADMIN },
    { name: "user2", passwordHash, groupId: group.id, role: Role.MEMBER },
    { name: "user3", passwordHash, groupId: group.id, role: Role.MEMBER },
  ];

  const createdAccounts: { id: string; name: string }[] = [];

  for (const user of users) {
    const account = await prisma.account.upsert({
      where: { groupId_name: { groupId: group.id, name: user.name } },
      update: {},
      create: user,
    });
    createdAccounts.push({ id: account.id, name: account.name });
  }

  // 各メンバー間で双方向のPartnerを作成
  for (const account of createdAccounts) {
    for (const otherAccount of createdAccounts) {
      if (account.id !== otherAccount.id) {
        await prisma.partner.upsert({
          where: {
            ownerId_name: { ownerId: account.id, name: otherAccount.name },
          },
          update: {},
          create: {
            name: otherAccount.name,
            ownerId: account.id,
            linkedAccountId: otherAccount.id,
          },
        });
      }
    }
  }

  console.log("Seed data created successfully");
  console.log("Default password for all users: password123");
  console.log(`Invite code: ${group.inviteCode}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
