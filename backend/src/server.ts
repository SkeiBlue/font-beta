import { env } from "./config/env.js";
import { buildApp } from "./app.js";

async function main() {
  const app = await buildApp();

  try {
    const address = await app.listen({ host: env.host, port: env.port });
    app.log.info(`Server listening at ${address}`);
  } catch (err) {
    app.log.error({ err }, "failed to start server");
    process.exit(1);
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
