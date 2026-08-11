"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import { site } from "@/lib/site";

export type CartItem = {
  /** id único da linha: produto + combinação de opções */
  key: string;
  productId: string;
  slug: string;
  name: string;
  /** Preço de uma unidade avulsa, já com os adicionais das opções. */
  unitPrice: number;
  quantity: number;
  options: Record<string, string>;
  image?: string;
  /** Desconto por quantidade herdado da calculadora. */
  faixas?: { qtd: number; preco: number }[];
};

/**
 * Preço unitário considerando a quantidade no carrinho.
 *
 * As faixas vêm em reais, calculadas sobre o preço base da peça. Aqui elas
 * viram proporção e são aplicadas sobre `unitPrice` — assim o desconto por
 * volume continua valendo mesmo quando o cliente escolhe um tamanho maior,
 * que custa mais que a base.
 */
export function precoUnitario(item: CartItem) {
  const faixas = item.faixas;
  if (!faixas || faixas.length < 2) return item.unitPrice;

  const cheio = faixas[0]?.preco;
  if (!cheio || cheio <= 0) return item.unitPrice;

  const aplicavel = [...faixas]
    .sort((a, b) => b.qtd - a.qtd)
    .find((f) => item.quantity >= f.qtd);

  if (!aplicavel) return item.unitPrice;
  return +(item.unitPrice * (aplicavel.preco / cheio)).toFixed(2);
}

type State = { items: CartItem[] };

type Action =
  | { type: "add"; item: CartItem }
  | { type: "remove"; key: string }
  | { type: "setQty"; key: string; quantity: number }
  | { type: "clear" }
  | { type: "hydrate"; items: CartItem[] };

const STORAGE_KEY = "moldarte3d.cart.v1";

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return { items: action.items };

    case "add": {
      const existing = state.items.find((i) => i.key === action.item.key);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.key === action.item.key
              ? { ...i, quantity: i.quantity + action.item.quantity }
              : i,
          ),
        };
      }
      return { items: [...state.items, action.item] };
    }

    case "remove":
      return { items: state.items.filter((i) => i.key !== action.key) };

    case "setQty":
      return {
        items: state.items
          .map((i) =>
            i.key === action.key
              ? { ...i, quantity: Math.max(0, action.quantity) }
              : i,
          )
          .filter((i) => i.quantity > 0),
      };

    case "clear":
      return { items: [] };
  }
}

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  shipping: number;
  total: number;
  freeShippingProgress: number;
  missingForFreeShipping: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  add: (item: Omit<CartItem, "key"> & { key?: string }) => void;
  remove: (key: string) => void;
  setQty: (key: string, quantity: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function buildKey(productId: string, options: Record<string, string>) {
  const suffix = Object.entries(options)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join("|");
  return suffix ? `${productId}__${suffix}` : productId;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [] });
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Carrega o carrinho salvo no navegador.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) dispatch({ type: "hydrate", items: JSON.parse(raw) });
    } catch {
      // storage indisponível (modo privado) — segue com carrinho vazio
    }
    setHydrated(true);
  }, []);

  // Persiste a cada mudança (só depois de hidratar, para não apagar o salvo).
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch {
      /* ignora */
    }
  }, [state.items, hydrated]);

  // Trava o scroll do body enquanto o drawer está aberto.
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const value = useMemo<CartContextValue>(() => {
    const count = state.items.reduce((n, i) => n + i.quantity, 0);
    const subtotal = state.items.reduce(
      (sum, i) => sum + precoUnitario(i) * i.quantity,
      0,
    );
    const qualifiesFree =
      subtotal >= site.shipping.freeShippingFrom || subtotal === 0;
    const shipping = qualifiesFree ? 0 : site.shipping.flatRate;

    return {
      items: state.items,
      count,
      subtotal,
      shipping,
      total: subtotal + shipping,
      freeShippingProgress: Math.min(
        100,
        (subtotal / site.shipping.freeShippingFrom) * 100,
      ),
      missingForFreeShipping: Math.max(
        0,
        site.shipping.freeShippingFrom - subtotal,
      ),
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      add: (item) =>
        dispatch({
          type: "add",
          item: { ...item, key: item.key ?? buildKey(item.productId, item.options) },
        }),
      remove: (key) => dispatch({ type: "remove", key }),
      setQty: (key, quantity) => dispatch({ type: "setQty", key, quantity }),
      clear: () => dispatch({ type: "clear" }),
    };
  }, [state.items, isOpen]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart precisa estar dentro de <CartProvider>");
  return ctx;
}
