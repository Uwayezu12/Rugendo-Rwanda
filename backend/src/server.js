import "dotenv/config";
import app from "./app.js";
import { env } from "./config/env.js";
import prisma from "./lib/prisma.js";

async function main() {
  // Verify DB connection
  await prisma.$connect();
  console.log("✔ Database connected");

  app.listen(env.port, () => {
    console.log(
      `✔ Server running on http://localhost:${env.port} [${env.nodeEnv}]`,
    );
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
