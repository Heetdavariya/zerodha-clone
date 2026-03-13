import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <h3>Zerodha</h3>
          <p>India's largest stock broker. We pioneer the concept of discount broking and price transparency.</p>
        </div>
        <div className="footer-col">
          <h4>Company</h4>
          <Link to="/about">About</Link>
          <Link to="/products">Products</Link>
          <Link to="/pricing">Pricing</Link>
          <Link to="/support">Support</Link>
        </div>
        <div className="footer-col">
          <h4>Products</h4>
          <a href="#">Kite</a>
          <a href="#">Console</a>
          <a href="#">Coin</a>
          <a href="#">Varsity</a>
        </div>
        <div className="footer-col">
          <h4>Legal</h4>
          <a href="#">NSE</a>
          <a href="#">BSE</a>
          <a href="#">MCX</a>
          <a href="#">SEBI</a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Zerodha Broking Ltd. All rights reserved.</span>
        <span>CIN: U67120KA2010PTC040918</span>
      </div>
    </footer>
  );
}
