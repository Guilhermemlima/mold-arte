"use client";

/**
 * Campo de escolha com rótulo.
 *
 * Estava dentro do formulário de orçamento; saiu de lá quando o pedido de
 * brindes passou a precisar do mesmo campo. Dois selects iguais em telas
 * diferentes é o começo de duas telas que envelhecem separadas.
 */
export default function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  // O rótulo precisa apontar para o campo. Sem o `htmlFor`, quem usa leitor de
  // tela ouve "caixa de seleção" e mais nada — não dá para saber se aquilo é
  // material, acabamento ou prazo.
  const id = `sel-${label.toLowerCase().replace(/[^a-z]+/g, "-")}`;

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-xs font-medium uppercase tracking-wider text-silver-400"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-navy-900 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-cyan-400/60"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
