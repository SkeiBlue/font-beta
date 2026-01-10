import type { ProductConfig } from "./ProductConfig";
import { setApiBaseUrl } from "../api/client";

let currentProduct: ProductConfig | null = null;

export function initProduct(config: ProductConfig) {
  currentProduct = config;
  setApiBaseUrl(config.apiBaseUrl);
  return config;
}

export function getProduct(): ProductConfig {
  if (!currentProduct) {
    // Fallback safe (dev) : évite un crash si initProduct n'a pas été appelé.
    return {
      key: "font",
      displayName: "FONT",
      apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "/api",
      appBasePath: "/app",
    };
  }
  return currentProduct;
}
