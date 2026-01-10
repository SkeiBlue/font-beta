export type ProductConfig = {
  /** Identifiant du produit (ex: "font") */
  key: string;
  /** Nom affiché (ex: "FONT") */
  displayName: string;
  /** Base URL API (ex: "/api") */
  apiBaseUrl: string;
  /** Base path app (ex: "/app") */
  appBasePath: string;
};
