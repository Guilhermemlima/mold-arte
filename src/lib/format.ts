export const brl = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

export const slugify = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Junta classes condicionais sem precisar de dependência externa. */
export const cx = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(" ");

/** 12345 -> "12,3 mil" (usado nos contadores da home) */
export const compact = (value: number) =>
  new Intl.NumberFormat("pt-BR", { notation: "compact" }).format(value);
