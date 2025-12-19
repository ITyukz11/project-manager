import { PrismaClient, Role } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("Aa321321", 10);

  // 1️⃣ Create or fetch the SuperAdmin user
  const superAdminUser = await prisma.user.upsert({
    where: { username: "superadmin" },
    update: {},
    create: {
      email: "jaren.magsakay@gmail.com",
      name: "Jaren Magsakay",
      password: hashedPassword,
      username: "superadmin",
      role: Role.SUPERADMIN,
      messengerLink: "http://m.me/itsumoboys.woodiz",
    },
  });

  // 2️⃣ Create or update the SuperAdmin record linked to this user
  await prisma.superAdmin.upsert({
    where: { ownerId: superAdminUser.id },
    update: {},
    create: {
      ownerId: superAdminUser.id,
      name: "DVO",
      location: "Philippines", // optional
    },
  });

  console.log("SuperAdmin user created successfully");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
