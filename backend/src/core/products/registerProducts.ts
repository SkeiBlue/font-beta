import type { FastifyInstance } from "fastify";
import type { ProductConfig } from "./ProductConfig";

export async function registerProducts(app: FastifyInstance, products: ProductConfig[]) {
  for (const p of products) {
    if (!p.basePath) {
      await p.register(app);
      continue;
    }

    await app.register(async (subApp) => {
      await p.register(subApp as FastifyInstance);
    }, { prefix: p.basePath });
  }
}
