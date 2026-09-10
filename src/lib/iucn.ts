// Integración con la API de la Lista Roja de la IUCN
// TODO: Agregar IUCN_API_TOKEN en .env.local
// Documentación: https://apiv3.iucnredlist.org/

export type IUCNCategory =
  | "EX"  // Extinto
  | "EW"  // Extinto en estado silvestre
  | "CR"  // En peligro crítico
  | "EN"  // En peligro
  | "VU"  // Vulnerable
  | "NT"  // Casi amenazado
  | "LC"  // Preocupación menor
  | "DD"  // Datos insuficientes
  | "NE"; // No evaluado

export const IUCN_LABELS: Record<IUCNCategory, string> = {
  EX: "Extinto",
  EW: "Extinto en estado silvestre",
  CR: "En peligro crítico",
  EN: "En peligro",
  VU: "Vulnerable",
  NT: "Casi amenazado",
  LC: "Preocupación menor",
  DD: "Datos insuficientes",
  NE: "No evaluado",
};

export const IUCN_COLORS: Record<IUCNCategory, string> = {
  EX: "#000000",
  EW: "#542344",
  CR: "#CC0000",
  EN: "#CC6600",
  VU: "#CCCC00",
  NT: "#006666",
  LC: "#006600",
  DD: "#666666",
  NE: "#AAAAAA",
};
