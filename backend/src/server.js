import "dotenv/config";
import app from "./app.js";
import { env } from "./config/env.js";
import prisma from "./lib/prisma.js";

async function main() {
  // Verify DB connection
  await prisma.$connect();
  console.log("✔ Database connected");

  const PORT = Number(process.env.PORT) || 3000;

  app.listen(PORT, () => {
    console.log(
      `✔ Server running on http://localhost:${PORT} [${process.env.NODE_ENV}]`,
    );
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
