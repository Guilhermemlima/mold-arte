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
import { calculaFrete } from "@/lib/frete";
import { descontoPercentual } from "@/lib/pagamento";

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
  /** Preço base da peça, sem o adicional de tamanho. É a referência que o
   *  banco usa para aplicar a faixa — precisa ser a mesma aqui. */
  precoBase?: number;
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

  // A referência é o preço base da peça — a mesma que o banco usa. E só
  // contam faixas a partir de duas unidades: a de uma unidade é apenas a
  // linha "1 un — preço cheio" da tabela, e quando ela discorda do preço
  // publicado a tela mostrava um valor e a cobrança saía com outro.
  const base = item.precoBase && item.precoBase > 0 ? item.precoBase : faixas[0]?.preco;
  if (!base || base <= 0) return item.unitPrice;

  const aplicavel = [...faixas]
    .filter((f) => f.qtd > 1)
    .sort((a, b) => b.qtd - a.qtd)
    .find((f) => item.quantity >= f.qtd);

  if (!aplicavel) return item.unitPrice;
  // Math.round e não toFixed: o banco arredonda metade para cima, e o toFixed
  // decide pelo valor binário, que às vezes desce. A diferença é de um centavo
  // por peça, e só aparece quando o cliente escolhe um tamanho com adicional e
  // ainda cai numa faixa de quantidade — mas multiplicada pelo lote vira uma
  // conta que não fecha entre a tela e a cobrança.
  return Math.round(item.unitPrice * (aplicavel.preco / base) * 100) / 100;
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

/** Cupom já conferido pelo servidor. */
export type Cupom = {
  codigo: string;
  tipo: "frete" | "percentual" | "valor";
  valor: number;
  descricao?: string;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  shipping: number;
  discount: number;
  cupom: Cupom | null;
  aplicaCupom: (c: Cupom | null) => void;
  total: number;
  freeShippingProgress: number;
  missingForFreeShipping: number;
  /** Estado da entrega, quando já conhecido. Muda o frete e o piso. */
  uf: string | null;
  defineUf: (uf: string | null) => void;
  freteGratis: boolean;
  freteGratisAcima: number;
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
  // Fica só na memória de propósito: cupom guardado no navegador pode vencer
  // ou ser desativado sem a tela perceber. A cada visita ele é conferido de novo.
  const [cupom, setCupom] = useState<Cupom | null>(null);
  // O checkout informa assim que o CEP é encontrado. Antes disso a loja
  // mostra a faixa mais barata, e o valor se ajusta quando o endereço
  // aparece — em vez de dar um susto só no fim.
  const [uf, setUf] = useState<string | null>(null);

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
    // Mesma conta que o banco refaz na hora do pedido. Aqui ela existe só
    // para a tela mostrar o valor certo antes de finalizar — quem manda é o
    // banco, porque frete vindo do navegador seria editável.
    const frete = calculaFrete(subtotal, uf, cupom?.tipo === "frete");
    const shipping = frete.valor;

    // O desconto do cupom sai da mesma função que o banco imita, e não de um
    // toFixed. O toFixed arredonda pelo valor binário: 5% de R$ 0,30 dá 0,015,
    // que em binário é 0,0149999… e desce para 0,01 — enquanto o banco, que
    // guarda dinheiro em decimal exato, sobe para 0,02. Um centavo de
    // diferença entre o que a tela mostra e o que a cobrança traz é o mesmo
    // defeito que esta loja já teve duas vezes, em escala menor.
    const discount =
      cupom?.tipo === "percentual"
        ? descontoPercentual(subtotal, cupom.valor)
        : cupom?.tipo === "valor"
          ? Math.min(subtotal, cupom.valor)
          : 0;

    return {
      items: state.items,
      count,
      subtotal,
      shipping,
      discount,
      cupom,
      aplicaCupom: setCupom,
      total: Math.max(0, subtotal - discount + shipping),
      freeShippingProgress: Math.min(100, (subtotal / frete.gratisAcima) * 100),
      missingForFreeShipping: frete.faltaParaGratis,
      uf,
      defineUf: setUf,
      freteGratis: frete.gratis,
      freteGratisAcima: frete.gratisAcima,
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
      clear: () => {
        dispatch({ type: "clear" });
        setCupom(null);
      },
    };
  }, [state.items, isOpen, cupom, uf]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart precisa estar dentro de <CartProvider>");
  return ctx;
}
