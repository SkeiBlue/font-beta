import type { ProductConfig } from "../../core/product/ProductConfig";

export const fontProductConfig: ProductConfig = {
  key: "font",
  displayName: "FONT",
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "/api",
  appBasePath: "/app",
};
