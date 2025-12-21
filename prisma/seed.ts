import { PrismaClient } from "../src/app/generated/prisma/client";
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

  const users = [
    { name: "user1", passwordHash },
    { name: "user2", passwordHash },
    { name: "user3", passwordHash },
  ];

  for (const user of users) {
    await prisma.account.upsert({
      where: { name: user.name },
      update: {},
      create: user,
    });
  }

  console.log("Seed data created successfully");
  console.log("Default password for all users: password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
