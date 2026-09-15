import React, { useContext } from "react";
import "./Navbar.css";
import { Link, NavLink } from "react-router-dom";
import { StoreContext } from "../../context/StoreContext";

const Navbar = () => {
  const { getTotalItemCount, settings } = useContext(StoreContext);
  const itemCount = getTotalItemCount();

  return (
    <>
      {/* Top Header */}
      <header className="client-navbar-wrap">
        <div className="client-navbar">
          {/* Brand Logo / Title */}
          <Link to="/" className="brand-logo-link">
            <div className="brand-crest">A</div>
            <div className="brand-text">
              <span className="brand-name">{settings.storeName || "Aura collection"}</span>
              <span className="brand-tagline">Custom Merch & Apparel</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="client-nav-links desktop-only">
            <NavLink
              to="/"
              end
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              Collection
            </NavLink>
            <NavLink
              to="/track"
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              Track Order
            </NavLink>
          </nav>

          {/* Right Side: Cart Icon */}
          <div className="client-nav-right">
            <Link to="/cart" className="cart-btn" aria-label="Shopping Cart">
              <svg className="cart-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <span className="cart-label">Cart</span>
              {itemCount > 0 && <span className="cart-count-badge">{itemCount}</span>}
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Floating Bottom Bar */}
      <nav className="mobile-bottom-nav mobile-only">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            isActive ? "mobile-nav-item active" : "mobile-nav-item"
          }
        >
          <svg className="m-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
          </svg>
          <span>Collection</span>
        </NavLink>

        <NavLink
          to="/track"
          className={({ isActive }) =>
            isActive ? "mobile-nav-item active" : "mobile-nav-item"
          }
        >
          <svg className="m-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
          <span>Track Order</span>
        </NavLink>

        <NavLink
          to="/cart"
          className={({ isActive }) =>
            isActive ? "mobile-nav-item active" : "mobile-nav-item"
          }
        >
          <div className="m-cart-icon-wrap">
            <svg className="m-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            {itemCount > 0 && <span className="m-badge">{itemCount}</span>}
          </div>
          <span>Cart</span>
        </NavLink>
      </nav>
    </>
  );
};

export default Navbar;
