// Real NSE listed stocks with approximate prices
export const NSE_STOCKS = [
  { symbol: "RELIANCE",   name: "Reliance Industries Ltd",        price: 2567.30, exchange: "NSE" },
  { symbol: "TCS",        name: "Tata Consultancy Services Ltd",  price: 3842.15, exchange: "NSE" },
  { symbol: "HDFCBANK",   name: "HDFC Bank Ltd",                  price: 1612.00, exchange: "NSE" },
  { symbol: "INFY",       name: "Infosys Ltd",                    price: 1596.45, exchange: "NSE" },
  { symbol: "ICICIBANK",  name: "ICICI Bank Ltd",                 price: 1089.75, exchange: "NSE" },
  { symbol: "HINDUNILVR", name: "Hindustan Unilever Ltd",         price: 2345.60, exchange: "NSE" },
  { symbol: "ITC",        name: "ITC Ltd",                        price: 428.90,  exchange: "NSE" },
  { symbol: "SBIN",       name: "State Bank of India",            price: 548.70,  exchange: "NSE" },
  { symbol: "BHARTIARTL", name: "Bharti Airtel Ltd",              price: 1567.20, exchange: "NSE" },
  { symbol: "KOTAKBANK",  name: "Kotak Mahindra Bank Ltd",        price: 1756.40, exchange: "NSE" },
  { symbol: "BAJFINANCE", name: "Bajaj Finance Ltd",              price: 6892.30, exchange: "NSE" },
  { symbol: "WIPRO",      name: "Wipro Ltd",                      price: 456.80,  exchange: "NSE" },
  { symbol: "HCLTECH",    name: "HCL Technologies Ltd",           price: 1345.60, exchange: "NSE" },
  { symbol: "ASIANPAINT", name: "Asian Paints Ltd",               price: 2876.45, exchange: "NSE" },
  { symbol: "MARUTI",     name: "Maruti Suzuki India Ltd",        price: 10234.50, exchange: "NSE" },
  { symbol: "AXISBANK",   name: "Axis Bank Ltd",                  price: 1023.40, exchange: "NSE" },
  { symbol: "TITAN",      name: "Titan Company Ltd",              price: 3234.80, exchange: "NSE" },
  { symbol: "SUNPHARMA",  name: "Sun Pharmaceutical Industries",  price: 1456.30, exchange: "NSE" },
  { symbol: "TECHM",      name: "Tech Mahindra Ltd",              price: 1234.50, exchange: "NSE" },
  { symbol: "LT",         name: "Larsen & Toubro Ltd",            price: 3456.70, exchange: "NSE" },
  { symbol: "ADANIPORTS", name: "Adani Ports & SEZ Ltd",          price: 820.30,  exchange: "NSE" },
  { symbol: "ADANIENT",   name: "Adani Enterprises Ltd",          price: 2456.70, exchange: "NSE" },
  { symbol: "TATAMOTORS", name: "Tata Motors Ltd",                price: 678.90,  exchange: "NSE" },
  { symbol: "TATASTEEL",  name: "Tata Steel Ltd",                 price: 145.60,  exchange: "NSE" },
  { symbol: "BAJAJFINSV", name: "Bajaj Finserv Ltd",              price: 1567.30, exchange: "NSE" },
  { symbol: "DRREDDY",    name: "Dr Reddy's Laboratories Ltd",    price: 5678.90, exchange: "NSE" },
  { symbol: "CIPLA",      name: "Cipla Ltd",                      price: 1234.50, exchange: "NSE" },
  { symbol: "EICHERMOT",  name: "Eicher Motors Ltd",              price: 4567.80, exchange: "NSE" },
  { symbol: "HEROMOTOCO", name: "Hero MotoCorp Ltd",              price: 4234.50, exchange: "NSE" },
  { symbol: "BRITANNIA",  name: "Britannia Industries Ltd",       price: 4567.80, exchange: "NSE" },
  { symbol: "NTPC",       name: "NTPC Ltd",                       price: 356.40,  exchange: "NSE" },
  { symbol: "ONGC",       name: "Oil & Natural Gas Corporation",  price: 267.80,  exchange: "NSE" },
  { symbol: "COALINDIA",  name: "Coal India Ltd",                 price: 434.50,  exchange: "NSE" },
  { symbol: "BPCL",       name: "Bharat Petroleum Corporation",   price: 345.60,  exchange: "NSE" },
  { symbol: "M&M",        name: "Mahindra & Mahindra Ltd",        price: 1890.30, exchange: "NSE" },
  { symbol: "INDUSINDBK", name: "IndusInd Bank Ltd",              price: 1023.40, exchange: "NSE" },
];

export function searchStocks(query) {
  if (!query || query.length < 1) return [];
  const q = query.toUpperCase();
  return NSE_STOCKS.filter(
    (s) => s.symbol.startsWith(q) || s.name.toUpperCase().includes(q)
  ).slice(0, 8);
}

export function getStock(symbol) {
  return NSE_STOCKS.find((s) => s.symbol === symbol.toUpperCase()) || null;
}