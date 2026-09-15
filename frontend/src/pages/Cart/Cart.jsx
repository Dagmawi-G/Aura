import React, { useContext } from "react";
import "./Cart.css";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate, Link } from "react-router-dom";

const Cart = () => {
  const {
    url,
    cartItems,
    cartDeliveryInfo,
    removeFromCart,
    updateCartQuantity,
    getCartSubtotal,
    getCartDeliveryFee,
    getTotalCartAmount,
    getTotalItemCount,
    settings
  } = useContext(StoreContext);

  const navigate = useNavigate();
  const subtotal = getCartSubtotal();
  const deliveryFee = getCartDeliveryFee();
  const total = getTotalCartAmount();

  if (cartItems.length === 0) {
    return (
      <div className="empty-cart-view aura-glass fade-in">
        <div className="empty-cart-icon">🛍️</div>
        <h2 className="empty-cart-title">Your Cart is Empty</h2>
        <p className="empty-cart-subtitle">
          Explore our collection of custom hoodies, tees, mugs, and accessories.
        </p>
        <Link to="/" className="btn-browse-collection">
          Browse Collection
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-page fade-in">
      <div className="cart-page-header">
        <h1 className="page-heading">Your Custom Order Cart</h1>
        <p className="page-subheading">
          Review your items, custom printed words, selected stickers, and delivery details
        </p>
      </div>

      {/* Single Delivery Destination Card for Entire Cart */}
      {cartDeliveryInfo && (
        <div className="cart-destination-banner aura-glass">
          <div className="dest-banner-top">
            <span className="dest-icon-badge">
              {cartDeliveryInfo.deliveryType === "Pickup" ? "🏬" : "🚚"}
            </span>
            <div className="dest-header-info">
              <h3 className="dest-title">
                {cartDeliveryInfo.deliveryType === "Pickup"
                  ? "Store Pickup Order"
                  : "Single Delivery Destination for this Order"}
              </h3>
              <p className="dest-sub">
                All {getTotalItemCount()} item(s) in this cart will be{" "}
                {cartDeliveryInfo.deliveryType === "Pickup"
                  ? "prepared for store pickup."
                  : "delivered together to this location."}
              </p>
            </div>
          </div>

          <div className="dest-meta-grid">
            <div className="dest-meta-item">
              <span className="dest-label">Fulfillment:</span>
              <strong>
                {cartDeliveryInfo.deliveryType === "Pickup"
                  ? "🏬 Store Pickup (Free)"
                  : "🚚 Door Delivery"}
              </strong>
            </div>

            {cartDeliveryInfo.deliveryType === "Delivery" && (
              <>
                <div className="dest-meta-item">
                  <span className="dest-label">Delivery Destination:</span>
                  <strong className="text-truncate">
                    {cartDeliveryInfo.customerLocation || "Pinned on map"}
                  </strong>
                </div>

                <div className="dest-meta-item">
                  <span className="dest-label">Route Distance:</span>
                  <strong>
                    {cartDeliveryInfo.distanceKm} km{" "}
                    {cartDeliveryInfo.routeDuration ? `(~${cartDeliveryInfo.routeDuration} min drive)` : ""}
                  </strong>
                </div>

                <div className="dest-meta-item">
                  <span className="dest-label">Order Delivery Fee:</span>
                  <strong className="highlight">
                    {cartDeliveryInfo.deliveryFee} {settings.currency} (Applied once)
                  </strong>
                </div>
              </>
            )}
          </div>

          <div className="dest-policy-note">
            <span>ℹ️</span>
            <span>
              <strong>Individual Delivery Policy:</strong> Each order delivers to one destination. To send items to a different address, please place an individual order.
            </span>
          </div>
        </div>
      )}

      <div className="cart-content-layout">
        {/* Left Column: List of Customized Items */}
        <div className="cart-items-column">
          {cartItems.map((item) => (
            <div key={item.cartItemId} className="cart-item-card aura-glass">
              <div className="cart-item-media">
                <img
                  src={`${url}/images/${item.image}`}
                  alt={item.name}
                  className="cart-item-img"
                />
              </div>

              <div className="cart-item-details">
                <div className="item-details-top">
                  <h3 className="cart-item-title">{item.name}</h3>
                  <button
                    type="button"
                    className="btn-remove-item"
                    onClick={() => removeFromCart(item.cartItemId)}
                    title="Remove item"
                  >
                    ✕
                  </button>
                </div>

                {/* Custom Print Tag */}
                {item.customText ? (
                  <div className="cart-custom-print">
                    <span className="print-label">🔤 Print:</span>
                    <span className="print-text">"{item.customText}"</span>
                  </div>
                ) : (
                  <span className="print-plain-note">No custom text</span>
                )}

                {/* Selected Stickers */}
                {item.selectedStickers && item.selectedStickers.length > 0 && (
                  <div className="cart-stickers-row">
                    <span className="stickers-tag-title">Stickers:</span>
                    <div className="cart-stickers-chips">
                      {item.selectedStickers.map((st, sidx) => (
                        <span key={sidx} className="cart-sticker-pill">
                          {st.image && (
                            <img
                              src={`${url}/images/${st.image}`}
                              alt=""
                              className="cart-sticker-icon"
                            />
                          )}
                          <span>{st.name}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity and Price Row */}
                <div className="item-price-quantity-row">
                  <div className="cart-qty-adjuster">
                    <button
                      type="button"
                      className="btn-qty"
                      onClick={() => updateCartQuantity(item.cartItemId, -1)}
                    >
                      −
                    </button>
                    <span className="qty-num">{item.quantity}</span>
                    <button
                      type="button"
                      className="btn-qty"
                      onClick={() => updateCartQuantity(item.cartItemId, 1)}
                    >
                      +
                    </button>
                  </div>

                  <div className="item-total-price">
                    <span className="unit-price">
                      {item.price} {settings.currency} each
                    </span>
                    <strong className="item-subtotal-val">
                      {item.price * item.quantity} {settings.currency}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Cart Totals & Proceed to Checkout */}
        <div className="cart-summary-column">
          <div className="cart-summary-card aura-glass">
            <h2 className="summary-title">Order Summary</h2>

            <div className="summary-breakdown-list">
              <div className="summary-row">
                <span className="summary-label">Items Subtotal:</span>
                <span className="summary-value">{subtotal} {settings.currency}</span>
              </div>

              <div className="summary-row">
                <span className="summary-label">Estimated Delivery Fee:</span>
                <span className="summary-value">
                  {deliveryFee > 0 ? `${deliveryFee} ${settings.currency}` : "Free (or Pickup)"}
                </span>
              </div>

              <div className="summary-divider"></div>

              <div className="summary-row total-row">
                <span className="summary-label">Total Amount:</span>
                <span className="summary-value total-val">
                  {total} {settings.currency}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="btn-proceed-payment"
              onClick={() => navigate("/order")}
            >
              <span>Proceed to Payment</span>
              <span className="arrow-icon">→</span>
            </button>

            <div className="guest-security-note">
              <span className="shield-icon">🛡️</span>
              <span>100% Guest Checkout • Instant Account Details & Transfer Screenshot Proof</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
