import { useState, useContext, useEffect, useRef } from "react";
import { NSE_STOCKS } from "../utils/stocks";
import GeneralContext from "../context/GeneralContext";
import api from "../utils/api";
import useLivePrices from "../hooks/useLivePrices";

function PriceRangeBar({ price }) {
  const seed = price % 97;
  const low = parseFloat((price * (0.72 + (seed % 15) * 0.01)).toFixed(2));
  const high = parseFloat((price * (1.12 + (seed % 12) * 0.01)).toFixed(2));
  const pct = Math.min(100, Math.max(0, ((price - low) / (high - low)) * 100));
  const color = pct < 33 ? "#ef4444" : pct < 66 ? "#f59e0b" : "#22c55e";

  return (
    <div style={{ minWidth: 130 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-muted)", marginBottom: 3 }}>
        <span>₹{low.toLocaleString("en-IN")}</span>
        <span>₹{high.toLocaleString("en-IN")}</span>
      </div>
      <div style={{ height: 5, background: "#e5e7eb", borderRadius: 99, position: "relative" }}>
        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width 0.4s" }} />
        <div style={{ position: "absolute", top: "50%", left: `${pct}%`, transform: "translate(-50%, -50%)", width: 9, height: 9, borderRadius: "50%", background: color, border: "2px solid #fff", boxShadow: "0 0 0 1px " + color }} />
      </div>
      <div style={{ textAlign: "center", fontSize: 10, color, marginTop: 3, fontWeight: 600 }}>
        {pct.toFixed(0)}% of range
      </div>
    </div>
  );
}

export default function Markets() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("symbol");
  const [sortDir, setSortDir] = useState("asc");
  const [watchlist, setWatchlist] = useState([]);
  const [adding, setAdding] = useState(null);
  const [livePriceMap, setLivePriceMap] = useState({});
  const [flashMap, setFlashMap] = useState({});
  const prevPrices = useRef({});
  const { openBuyWindow, openSellWindow, triggerRefresh, refreshCount } = useContext(GeneralContext);
  const { prices } = useLivePrices();

  useEffect(() => {
    api.get("/dashboard/watchlist").then(({ data }) => {
      setWatchlist(data.map((w) => w.name));
    }).catch(() => {});
  }, [refreshCount]);

  // Merge live prices + trigger flash animations
  useEffect(() => {
    if (!prices || Object.keys(prices).length === 0) return;
    const newFlashes = {};
    for (const [symbol, data] of Object.entries(prices)) {
      const old = prevPrices.current[symbol];
      if (old !== undefined && old !== data.price) {
        newFlashes[symbol] = data.price > old ? "up" : "down";
      }
      prevPrices.current[symbol] = data.price;
    }
    setLivePriceMap(prices);
    if (Object.keys(newFlashes).length > 0) {
      setFlashMap((f) => ({ ...f, ...newFlashes }));
      setTimeout(() => {
        setFlashMap((f) => {
          const copy = { ...f };
          for (const s of Object.keys(newFlashes)) delete copy[s];
          return copy;
        });
      }, 500);
    }
  }, [prices]);

  const addToWatchlist = async (stock) => {
    setAdding(stock.symbol);
    try {
      await api.post("/dashboard/watchlist", {
        name: stock.symbol,
        price: stock.price,
        change: (stock.price * 0.005).toFixed(2),
        changePercent: "+0.50%",
        isDown: false,
        exchange: stock.exchange,
      });
      setWatchlist((prev) => [...prev, stock.symbol]);
      triggerRefresh();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add to watchlist.");
    } finally {
      setAdding(null);
    }
  };

  const getLiveData = (stock) => {
    const live = livePriceMap[stock.symbol];
    if (live) return { price: live.price, pct: live.changePercent, isDown: live.isDown };
    const seed = stock.price % 10;
    const pct = ((seed - 5) * 0.3).toFixed(2);
    const isDown = parseFloat(pct) < 0;
    return { price: stock.price, pct: `${isDown ? "" : "+"}${pct}%`, isDown };
  };

  const filtered = NSE_STOCKS.filter((s) =>
    s.symbol.includes(search.toUpperCase()) ||
    s.name.toUpperCase().includes(search.toUpperCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    let valA = sortBy === "symbol" ? a.symbol : a.price;
    let valB = sortBy === "symbol" ? b.symbol : b.price;
    if (typeof valA === "string") return sortDir === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
    return sortDir === "asc" ? valA - valB : valB - valA;
  });

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("asc"); }
  };

  const SortIcon = ({ col }) => {
    if (sortBy !== col) return <i className="fa fa-sort" style={{ opacity: 0.3, marginLeft: 4 }} />;
    return <i className={`fa fa-sort-${sortDir === "asc" ? "up" : "down"}`} style={{ marginLeft: 4, color: "var(--zerodha-blue)" }} />;
  };

  const inWatchlist = (symbol) => watchlist.includes(symbol);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Market Watch</h2>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
            {NSE_STOCKS.length} NSE listed stocks · Buy, Sell or add to Watchlist
          </p>
        </div>
        <div style={{ position: "relative", width: 260 }}>
          <i className="fa fa-search" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: 13 }} />
          <input
            className="form-control"
            style={{ paddingLeft: 32 }}
            placeholder="Search stocks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
        {[
          { label: "Total stocks", value: NSE_STOCKS.length, color: "var(--zerodha-blue)" },
          { label: "Gainers", value: NSE_STOCKS.filter((s) => !getLiveData(s).isDown).length, color: "var(--zerodha-green)" },
          { label: "Losers", value: NSE_STOCKS.filter((s) => getLiveData(s).isDown).length, color: "var(--zerodha-red)" },
          { label: "In your watchlist", value: watchlist.length, color: "#9b59b6" },
        ].map((s) => (
          <div key={s.label} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "12px 20px", flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="table-wrap">
          <table style={{ tableLayout: "fixed" }}>
            <thead>
              <tr>
                <th style={{ cursor: "pointer", width: 120 }} onClick={() => toggleSort("symbol")}>
                  Symbol <SortIcon col="symbol" />
                </th>
                <th style={{ width: "auto" }}>Company name</th>
                <th style={{ width: 80 }}>Exchange</th>
                <th style={{ cursor: "pointer", width: 150, minWidth: 150 }} onClick={() => toggleSort("price")}>
                  Price <SortIcon col="price" />
                </th>
                <th style={{ width: 100 }}>Change</th>
                <th style={{ width: 180 }}>52W Range</th>
                <th style={{ width: 200 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
                    No stocks found for "{search}"
                  </td>
                </tr>
              ) : sorted.map((stock) => {
                const { price, pct, isDown } = getLiveData(stock);
                const flash = flashMap[stock.symbol];
                const alreadyAdded = inWatchlist(stock.symbol);
                return (
                  <tr
                    key={stock.symbol}
                    style={{
                      transition: "background 0.3s",
                      background: flash === "up" ? "rgba(34,197,94,0.10)" : flash === "down" ? "rgba(239,68,68,0.10)" : "",
                    }}
                  >
                    <td>
                      <span style={{ fontWeight: 700, fontSize: 14, color: "var(--zerodha-blue)" }}>{stock.symbol}</span>
                    </td>
                    <td style={{ fontSize: 13, color: "var(--text-secondary)" }}>{stock.name}</td>
                    <td>
                      <span style={{ fontSize: 11, background: "#e8f0fe", color: "#1a56db", padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>
                        {stock.exchange}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, fontSize: 15, transition: "color 0.3s", color: flash === "up" ? "var(--zerodha-green)" : flash === "down" ? "var(--zerodha-red)" : "inherit" }}>
                      ₹{price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      {flash && <span style={{ marginLeft: 4, fontSize: 11 }}>{flash === "up" ? "▲" : "▼"}</span>}
                    </td>
                    <td>
                      <span style={{ color: isDown ? "var(--zerodha-red)" : "var(--zerodha-green)", fontWeight: 600, fontSize: 13 }}>
                        {pct}
                      </span>
                    </td>
                    <td>
                      <PriceRangeBar price={price} />
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <button className="btn btn-sm btn-primary" onClick={() => openBuyWindow(stock.symbol)} style={{ padding: "5px 12px", fontSize: 12 }}>Buy</button>
                        <button className="btn btn-sm btn-danger" onClick={() => openSellWindow(stock.symbol)} style={{ padding: "5px 12px", fontSize: 12 }}>Sell</button>
                        <button
                          className="btn btn-sm"
                          onClick={() => !alreadyAdded && addToWatchlist(stock)}
                          disabled={alreadyAdded || adding === stock.symbol}
                          style={{
                            padding: "5px 10px", fontSize: 12,
                            background: alreadyAdded ? "#f0fdf4" : "#fff",
                            color: alreadyAdded ? "var(--zerodha-green)" : "var(--text-muted)",
                            border: `1px solid ${alreadyAdded ? "var(--zerodha-green)" : "var(--border)"}`,
                            borderRadius: "var(--radius-sm)",
                            cursor: alreadyAdded ? "default" : "pointer",
                          }}
                        >
                          {adding === stock.symbol
                            ? <i className="fa fa-spinner fa-spin" />
                            : alreadyAdded
                            ? <><i className="fa fa-check" /> Watching</>
                            : <><i className="fa fa-plus" /> Watch</>
                          }
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}