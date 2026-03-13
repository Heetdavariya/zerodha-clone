import { useState, useRef, useEffect } from "react";
import { searchStocks } from "../utils/stocks";

export default function StockSearch({ value, onChange, placeholder = "Search stock e.g. INFY", disabled }) {
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (value && value !== query) { setQuery(value); setSelected(true); }
  }, [value]);

  const handleInput = (e) => {
    const val = e.target.value.toUpperCase();
    setQuery(val);
    setSelected(false);
    if (val.length >= 1) {
      const found = searchStocks(val);
      setResults(found);
      setOpen(found.length > 0);
    } else {
      setResults([]); setOpen(false);
    }
    if (!val) onChange(null);
  };

  const handleSelect = (stock) => {
    setQuery(stock.symbol);
    setSelected(true);
    setOpen(false);
    setResults([]);
    onChange(stock);
  };

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <input
          className="form-control"
          value={query}
          onChange={handleInput}
          onFocus={() => { if (results.length > 0 && !selected) setOpen(true); }}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          style={{ paddingRight: selected ? 36 : 12, borderColor: selected ? "var(--zerodha-green)" : undefined }}
        />
        {selected && (
          <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--zerodha-green)", fontSize: 16 }}>✓</span>
        )}
      </div>

      {open && results.length > 0 && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 9999, maxHeight: 280, overflowY: "auto" }}>
          {results.map((stock) => (
            <div
              key={stock.symbol}
              onClick={() => handleSelect(stock)}
              style={{ padding: "10px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#f8f9ff"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{stock.symbol}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{stock.name}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>₹{stock.price.toLocaleString("en-IN")}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{stock.exchange}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && results.length === 0 && query.length >= 2 && !selected && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "12px 14px", fontSize: 13, color: "var(--text-muted)", zIndex: 9999, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>
          No stocks found for "{query}"
        </div>
      )}
    </div>
  );
}