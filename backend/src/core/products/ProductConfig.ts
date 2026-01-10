export type ProductId = "font";

export type ProductConfig = {
  id: ProductId;
  name: string;

  /**
   * Optional URL prefix for the product (example: "/font").
   * To keep existing URLs unchanged, keep it "".
   */
  basePath: string;

  register: (app: import("fastify").FastifyInstance) => void | Promise<void>;
};
