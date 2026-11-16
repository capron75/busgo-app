import { auth } from "../lib/auth";
import { db } from "../prisma/db";

const email = "demo@busgo.local";
const password = "Busgo-demo-1";

async function main() {
  const result = await auth.api.signUpEmail({
    body: {
      name: "Demo User",
      email,
      password,
    },
  });

  console.log(`Seeded ${result.user.email}`);
  await db.close();
}

main().catch(async (error: unknown) => {
  console.error(error);
  await db.close();
  process.exitCode = 1;
});
