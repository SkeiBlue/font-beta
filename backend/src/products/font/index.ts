import type { ProductConfig } from "../../core/products/ProductConfig";
import { registerFontRoutes } from "./registerFontRoutes";

export const fontProduct: ProductConfig = {
  id: "font",
  name: "FONT",
  basePath: "", // keep existing URLs unchanged
  register: (app) => registerFontRoutes(app),
};
