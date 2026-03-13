// About Page
export function AboutPage() {
  return (
    <>
      <section className="hero" style={{ padding: "60px 5% 40px" }}>
        <h1 style={{ fontSize: "clamp(26px, 5vw, 42px)" }}>About Zerodha</h1>
        <p>We broke the myth that brokerage has to be expensive. Built by traders, for traders.</p>
      </section>
      <section className="section">
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 20 }}>Our story</h2>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.9, marginBottom: 24 }}>
            Zerodha was founded in 2010 with a simple mission: to make financial markets accessible to every Indian. We pioneered discount broking in India — charging a flat ₹20 per trade instead of percentage-based fees that drained a trader's profits.
          </p>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.9, marginBottom: 24 }}>
            Today, we are India's largest retail stockbroker with over 1.5 crore active clients, accounting for roughly 15% of India's daily retail trading volume.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, marginTop: 40 }}>
            {[["2010", "Founded"], ["1.5 Cr+", "Active clients"], ["₹4 Lakh Cr", "Daily turnover"], ["6000+", "Employees"]].map(([v, l]) => (
              <div key={l} style={{ background: "#f8f9fa", borderRadius: 12, padding: "28px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 30, fontWeight: 700, color: "var(--zerodha-blue)" }}>{v}</div>
                <div style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 6 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

// Products Page
export function ProductPage() {
  const products = [
    { emoji: "📈", name: "Kite", desc: "Our ultra-fast flagship trading platform with streaming market data, advanced charts, and an elegant UI. Available on web, Android, and iOS.", tag: "Trading" },
    { emoji: "📊", name: "Console", desc: "The central dashboard for your Zerodha account. Gain insights into your trades and investments with in-depth reports and visualisations.", tag: "Analytics" },
    { emoji: "💰", name: "Coin", desc: "Buy direct mutual funds online, commission-free, delivered directly to your Demat account.", tag: "Mutual Funds" },
    { emoji: "🔌", name: "Kite Connect API", desc: "Build powerful trading platforms with our simple HTTP/JSON APIs. Used by thousands of developers and fintechs.", tag: "Developer" },
    { emoji: "📚", name: "Varsity", desc: "A free, comprehensive collection of stock market lessons. Content broken down into bite-size cards to help you learn on the go.", tag: "Education" },
  ];
  return (
    <>
      <section className="hero" style={{ padding: "60px 5% 40px" }}>
        <h1 style={{ fontSize: "clamp(26px, 5vw, 42px)" }}>Our products</h1>
        <p>Everything you need to invest, trade, learn, and grow — all under one roof.</p>
      </section>
      <section className="section">
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gap: 24 }}>
          {products.map((p) => (
            <div key={p.name} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, padding: "28px 32px", display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
              <div style={{ fontSize: 48, lineHeight: 1 }}>{p.emoji}</div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <h3 style={{ fontSize: 20, fontWeight: 700 }}>{p.name}</h3>
                  <span className="tag">{p.tag}</span>
                </div>
                <p style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

// Pricing Page
export function PricingPage() {
  return (
    <>
      <section className="hero" style={{ padding: "60px 5% 40px" }}>
        <h1 style={{ fontSize: "clamp(26px, 5vw, 42px)" }}>Unbeatable pricing</h1>
        <p>Flat fees and no hidden charges. The most transparent pricing in the industry.</p>
      </section>
      <section className="section">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24, maxWidth: 900, margin: "0 auto" }}>
          {[
            { title: "Equity Delivery", price: "₹0", sub: "Free forever", items: ["No brokerage on delivery trades", "NSE + BSE access", "Advanced charting", "Mobile app included"] },
            { title: "Intraday / F&O", price: "₹20", sub: "Per executed order", items: ["Flat ₹20 per order", "Equity intraday", "Futures & Options", "Commodities & Currency"], featured: true },
            { title: "Mutual Funds", price: "₹0", sub: "Zero commission", items: ["Direct mutual funds", "No commission ever", "Delivered to Demat", "SIP support"] },
          ].map((p) => (
            <div key={p.title} className={`pricing-card${p.featured ? " featured" : ""}`}>
              <h3>{p.title}</h3>
              <p>{p.sub}</p>
              <div className="price">{p.price}</div>
              <ul className="pricing-list" style={{ marginTop: 20 }}>
                {p.items.map((i) => <li key={i}><i className="fa fa-check" />{i}</li>)}
              </ul>
              <a href="/signup" className={`btn btn-${p.featured ? "primary" : "outline"}`} style={{ width: "100%" }}>Get started</a>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

// Support Page
export function SupportPage() {
  const faqs = [
    { q: "How do I open an account?", a: "Click 'Open Account', fill in your details, complete e-KYC with your Aadhaar, and your account will be ready in 24–48 hours." },
    { q: "What documents are required?", a: "PAN card, Aadhaar card, bank account details, and a cancelled cheque or bank statement." },
    { q: "How do I add funds to my account?", a: "Login to Kite, go to Funds, and use UPI, net banking, or NEFT/RTGS to transfer funds." },
    { q: "Is my money safe with Zerodha?", a: "Yes. Client funds are held in a separate account with the exchange. We never use client funds for our own operations." },
    { q: "What are the trading hours?", a: "NSE/BSE equity: 9:15 AM to 3:30 PM IST on trading days. Commodity trading extends to 11:30 PM." },
  ];
  return (
    <>
      <section className="hero" style={{ padding: "60px 5% 40px" }}>
        <h1 style={{ fontSize: "clamp(26px, 5vw, 42px)" }}>Support</h1>
        <p>We're here to help. Browse our FAQs or raise a ticket.</p>
      </section>
      <section className="section" style={{ maxWidth: 760, margin: "0 auto" }}>
        <h2 style={{ fontSize: 26, fontWeight: 700, marginBottom: 28 }}>Frequently asked questions</h2>
        {faqs.map((f) => (
          <div key={f.q} style={{ borderBottom: "1px solid var(--border)", paddingBottom: 20, marginBottom: 20 }}>
            <h4 style={{ fontWeight: 600, marginBottom: 10 }}>{f.q}</h4>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>{f.a}</p>
          </div>
        ))}
      </section>
    </>
  );
}

// NotFound
export function NotFound() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, textAlign: "center", padding: 40 }}>
      <div style={{ fontSize: 80, lineHeight: 1 }}>404</div>
      <h2 style={{ fontSize: 28, fontWeight: 700 }}>Page not found</h2>
      <p style={{ color: "var(--text-secondary)" }}>The page you're looking for doesn't exist.</p>
      <a href="/" className="btn btn-primary">Go home</a>
    </div>
  );
}
