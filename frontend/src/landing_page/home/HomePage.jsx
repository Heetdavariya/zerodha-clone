import { Link } from "react-router-dom";

export default function HomePage() {
  const features = [
    { icon: "fa-bolt", title: "Ultra-fast trading", desc: "Execute trades in milliseconds with our super-fast order management system." },
    { icon: "fa-chart-line", title: "Advanced charting", desc: "100+ indicators, 6+ chart types, and tools for technical analysis." },
    { icon: "fa-shield-alt", title: "Safe & secure", desc: "Two-factor authentication, fund segregation, and industry-best security." },
    { icon: "fa-rupee-sign", title: "₹0 brokerage", desc: "Free equity delivery. Flat ₹20 for intraday, F&O, and other segments." },
    { icon: "fa-mobile-alt", title: "Mobile trading", desc: "Trade on the go with our award-winning Kite mobile application." },
    { icon: "fa-graduation-cap", title: "Learn with Varsity", desc: "Free, comprehensive stock market lessons for beginners to experts." },
  ];

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <h1>Invest in everything</h1>
        <p>Online platform to invest in stocks, derivatives, mutual funds, ETFs, bonds, and more.</p>
        <div className="hero-buttons">
          <Link to="/signup" className="btn btn-primary btn-lg">Start investing now</Link>
          <Link to="/products" className="btn btn-outline btn-lg">Explore products</Link>
        </div>
        <div className="hero-stats">
          <div className="stat-item"><h3>1.5 Cr+</h3><p>Active clients</p></div>
          <div className="stat-item"><h3>₹4 Lakh Cr</h3><p>Daily turnover</p></div>
          <div className="stat-item"><h3>15%</h3><p>Of India's daily retail volume</p></div>
          <div className="stat-item"><h3>₹0</h3><p>Account opening fee</p></div>
        </div>
      </section>

      {/* Features */}
      <section className="section section-alt section-center">
        <h2 className="section-title">Why Zerodha?</h2>
        <p className="section-subtitle">We've built the tools and platform to make investing accessible to everyone in India.</p>
        <div className="feature-grid">
          {features.map((f) => (
            <div className="feature-card" key={f.title}>
              <div className="feature-icon"><i className={`fa ${f.icon}`} /></div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="section section-center" style={{ background: "linear-gradient(135deg, #387ed1 0%, #1e3a8a 100%)", color: "#fff", padding: "80px 5%" }}>
        <h2 style={{ fontSize: "36px", fontWeight: 700, marginBottom: 16 }}>Ready to start?</h2>
        <p style={{ fontSize: "18px", opacity: 0.85, marginBottom: 36 }}>Open a free account in under 10 minutes.</p>
        <Link to="/signup" className="btn btn-lg" style={{ background: "#fff", color: "#387ed1", fontWeight: 700 }}>
          Open free account
        </Link>
      </section>
    </>
  );
}
