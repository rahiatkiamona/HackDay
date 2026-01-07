import { app } from "./app";
import { env } from "./config/env";
import { prisma } from "./config/prisma";

const start = async () => {
  try {
    await prisma.$connect();
    app.listen(env.port, () => {
      // eslint-disable-next-line no-console
      console.log(`Auth server listening on port ${env.port}`);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to start server", err);
    process.exit(1);
  }
};

void start();
