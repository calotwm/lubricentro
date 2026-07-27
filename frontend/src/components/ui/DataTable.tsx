import { useState, type ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  emptyMessage?: string;
  actions?: (row: T) => ReactNode;
}

export default function DataTable<T>({
  columns,
  data,
  keyField,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Buscar...",
  emptyMessage = "Sin registros.",
  actions,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const getVal = (row: T, key: string): unknown =>
    (row as Record<string, unknown>)[key];

  const sorted = sortKey
    ? [...data].sort((a, b) => {
        const av = getVal(a, sortKey);
        const bv = getVal(b, sortKey);
        if (av == null) return 1;
        if (bv == null) return -1;
        const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
        return sortDir === "asc" ? cmp : -cmp;
      })
    : data;

  return (
    <div className="space-y-4">
      {onSearchChange && (
        <input
          type="text"
          value={searchValue ?? ""}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full max-w-sm rounded-lg border border-[#333] bg-[#1a1a1a] px-4 py-2 text-sm text-white placeholder:text-[#666] focus:border-[#dc2626] focus:outline-none focus:ring-1 focus:ring-[#dc2626]"
        />
      )}
      <div className="overflow-x-auto rounded-xl border border-[#333] bg-[#1a1a1a]">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#333] bg-[#222]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="cursor-pointer px-4 py-3 font-medium text-[#a0a0a0] select-none hover:text-white"
                >
                  {col.header}
                  {sortKey === col.key && (
                    <span className="ml-1 text-xs">{sortDir === "asc" ? "\u2191" : "\u2193"}</span>
                  )}
                </th>
              ))}
              {actions && <th className="px-4 py-3 font-medium text-[#a0a0a0]">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-4 py-8 text-center text-[#666]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sorted.map((row, i) => (
                <tr
                  key={String(getVal(row, keyField))}
                  className={`border-b border-[#333] ${i % 2 === 1 ? "bg-[#111]" : ""}`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-white">
                      {col.render ? col.render(row) : String(getVal(row, col.key) ?? "")}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3">{actions(row)}</td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
