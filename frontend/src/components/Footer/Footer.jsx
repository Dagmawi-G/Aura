import React, { useContext } from "react";
import "./Footer.css";
import { Link } from "react-router-dom";
import { StoreContext } from "../../context/StoreContext";

const Footer = () => {
  const { settings } = useContext(StoreContext);

  return (
    <footer className="aura-footer" id="footer">
      <div className="footer-container">
        {/* Left Column: Brand */}
        <div className="footer-brand-col">
          <div className="footer-brand-heading">
            <div className="footer-crest">A</div>
            <div className="footer-brand-text">
              <span className="footer-brand-name">{settings.storeName || "Aura collection"}</span>
              <span className="footer-brand-tag">Custom Merchandise & Apparel</span>
            </div>
          </div>
          <p className="footer-desc">
            Bespoke custom merchandise and curated essentials. Personalize premium hoodies, apparel, and lifestyle items with custom lettering & stickers.
          </p>
          <div className="footer-badges-row">
            <span className="footer-badge">✨ Custom Printing</span>
            <span className="footer-badge">🚚 Fast Fulfillment</span>
            <span className="footer-badge">🛡️ Guest Checkout</span>
          </div>
        </div>

        {/* Center Column: Quick Links */}
        <div className="footer-nav-col">
          <h4 className="footer-section-title">Navigation</h4>
          <ul className="footer-links-list">
            <li><Link to="/">Catalog Collection</Link></li>
            <li><Link to="/track">Track Live Order</Link></li>
            <li><Link to="/cart">Shopping Cart</Link></li>
          </ul>
        </div>

        {/* Right Column: Payments & Contact */}
        <div className="footer-payments-col">
          <h4 className="footer-section-title">Payment & Support</h4>
          <p className="footer-support-note">
            We accept instant bank transfers and mobile payments across Ethiopia:
          </p>
          <div className="payment-providers-pills">
            <span className="pm-pill">Telebirr</span>
            <span className="pm-pill">CBE (Commercial Bank)</span>
            <span className="pm-pill">Bank of Abyssinia</span>
            <span className="pm-pill">Awash Bank</span>
          </div>
          <p className="footer-address-text">
            📍 {settings.storeAddress || "Addis Ababa, Ethiopia"}
          </p>
        </div>
      </div>

      <div className="footer-bottom-bar">
        <p className="footer-copyright">
          © {new Date().getFullYear()} {settings.storeName || "Aura collection"}. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
