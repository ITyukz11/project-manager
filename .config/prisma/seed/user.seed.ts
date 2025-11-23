import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // Hash the password before seeding
  const hashedPassword = await bcrypt.hash("Aa321321", 10);

  await prisma.user.upsert({
    where: { email: "jaren.magsakay@gmail.com" },
    update: {},
    create: {
      email: "jaren.magsakay@gmail.com",
      name: "jaren",
      password: hashedPassword,
      username: "admin",
      role: "ADMIN",
      messengerLink: "http://m.me/itsumoboys.woodiz",
    },
  });
  console.log("Seeded admin user");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
