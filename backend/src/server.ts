import { env } from "./config/env";
import { buildApp } from "./app";

process.on("unhandledRejection", (err) => {
  // eslint-disable-next-line no-console
  console.error("[unhandledRejection]", err);
});
process.on("uncaughtException", (err) => {
  // eslint-disable-next-line no-console
  console.error("[uncaughtException]", err);
});

async function main() {
  const app = await buildApp();

  try {
    // Windows-friendly: do not pass host, let Fastify bind properly (IPv4+IPv6)
    const address = await app.listen({ port: env.port });
    app.log.info(`Server listening at ${address}`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("failed to start server:", err);
    process.exit(1);
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
