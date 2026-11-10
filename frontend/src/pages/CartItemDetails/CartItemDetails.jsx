import React, { useContext, useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { StoreContext } from "../../context/StoreContext";
import { toast } from "react-toastify";
import "./CartItemDetails.css";

const CartItemDetails = () => {
  const { cartItemId } = useParams();
  const navigate = useNavigate();

  const {
    cartItems,
    updateCartItem,
    removeFromCart,
    stickers_list,
    food_list,
    settings,
    url,
  } = useContext(StoreContext);

  // Find targeted cart item
  const item = cartItems.find((ci) => ci.cartItemId === cartItemId);

  // Find corresponding product for sticker filtering if available
  const product = food_list.find((f) => f._id === item?.foodId || f.name === item?.name);

  // Editable form state
  const [customText, setCustomText] = useState("");
  const [selectedStickers, setSelectedStickers] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [stickerTab, setStickerTab] = useState("Mix");

  // Sync state when item loads
  useEffect(() => {
    if (item) {
      setCustomText(item.customText || "");
      setSelectedStickers(item.selectedStickers || []);
      setQuantity(item.quantity || 1);
      // Auto-detect initial tab based on selected stickers
      if (item.selectedStickers && item.selectedStickers.length > 0) {
        const hasFixed = item.selectedStickers.some((s) => s.stickerType === "Fixed");
        if (hasFixed) setStickerTab("Fixed");
      }
    }
  }, [item]);

  // If item not found (e.g. refreshed after cart was cleared)
  if (!item) {
    return (
      <div className="cart-details-page empty-fallback fade-in">
        <div className="fallback-card aura-glass">
          <div className="fallback-icon">🔍</div>
          <h2>Item Not Found</h2>
          <p>This customized item is no longer in your cart.</p>
          <div className="fallback-actions">
            <button
              type="button"
              className="btn-primary-pill"
              onClick={() => navigate("/cart")}
            >
              ← Back to Cart
            </button>
            <button
              type="button"
              className="btn-outline-pill"
              onClick={() => navigate("/")}
            >
              Browse Collection
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filter available stickers for this product
  const availableStickers = stickers_list.filter((sticker) => {
    if (!product?.stickers || product.stickers.length === 0) return true;
    return product.stickers.includes(sticker.name) || product.stickers.includes(sticker._id);
  });

  const mixStickers = availableStickers.filter((s) => (s.stickerType || "Mix") === "Mix");
  const fixedStickers = availableStickers.filter((s) => (s.stickerType || "Mix") === "Fixed");

  // Toggle sticker selection
  const toggleSticker = (sticker) => {
    const isOut = typeof sticker.stockQuantity === "number" && sticker.stockQuantity <= 0;
    if (isOut) {
      toast.warning(`"${sticker.name}" is sold out!`);
      return;
    }

    const isFixed =
      (sticker.stickerType || "Mix") === "Fixed" ||
      fixedStickers.some((f) => f.name === sticker.name) ||
      stickerTab === "Fixed";

    const isAlreadySelected = selectedStickers.some((s) => s.name === sticker.name);

    if (isFixed) {
      if (isAlreadySelected) {
        setSelectedStickers([]);
      } else {
        // Fixed stickers allow only a single selection and clear any mixed stickers
        setSelectedStickers([
          { name: sticker.name, image: sticker.image, id: sticker._id, stickerType: "Fixed" },
        ]);
      }
    } else {
      // Mixed stickers: multiple stickers allowed, but automatically deselect any Fixed sticker
      if (isAlreadySelected) {
        setSelectedStickers((prev) => prev.filter((s) => s.name !== sticker.name));
      } else {
        setSelectedStickers((prev) => [
          ...prev.filter((s) => s.stickerType !== "Fixed"),
          { name: sticker.name, image: sticker.image, id: sticker._id, stickerType: "Mix" },
        ]);
      }
    }
  };

  // Written name change handler (max 7 characters, English words & numbers only)
  const handleCustomTextChange = (e) => {
    const val = e.target.value.toUpperCase();
    if (val.length <= 7 && /^[A-Z0-9 ]*$/.test(val)) {
      setCustomText(val);
    }
  };

  // Save changes and return to cart
  const handleSaveAndReturn = () => {
    updateCartItem(cartItemId, {
      customText: customText.trim(),
      selectedStickers,
      quantity,
    });
    navigate("/cart");
  };

  // Save changes and proceed directly to payment
  const handleSaveAndCheckout = () => {
    updateCartItem(cartItemId, {
      customText: customText.trim(),
      selectedStickers,
      quantity,
    });
    navigate("/order");
  };

  const handleRemove = () => {
    if (window.confirm(`Are you sure you want to remove "${item.name}" from your cart?`)) {
      removeFromCart(cartItemId);
      navigate("/cart");
    }
  };

  const itemSubtotal = item.price * quantity;

  return (
    <div className="cart-item-details-page fade-in">
      {/* Top Breadcrumb Navigation */}
      <div className="details-nav-bar">
        <button
          type="button"
          className="btn-back-link"
          onClick={() => navigate("/cart")}
        >
          ← Back to Cart
        </button>
        <span className="details-nav-sep">/</span>
        <span className="details-nav-current">Review & Edit Item</span>
      </div>

      <div className="details-header-section">
        <h1 className="details-page-title">Review & Edit Order Details</h1>
        <p className="details-page-subtitle">
          Fine-tune your custom written name, sticker selections, and quantity before placing your order.
        </p>
      </div>

      <div className="details-content-grid">
        {/* Left Column: Live Item Preview Card */}
        <div className="details-preview-column">
          <div className="preview-sticky-card aura-glass">
            <div className="preview-media-box">
              <img
                src={`${url}/images/${item.image}`}
                alt={item.name}
                className="preview-product-img"
              />
              {customText && (
                <div className="preview-custom-overlay">
                  <span className="preview-overlay-text">{customText}</span>
                </div>
              )}
            </div>

            <div className="preview-info-box">
              <h2 className="preview-item-title">{item.name}</h2>
              <div className="preview-pricing-line">
                <span className="preview-unit-rate">
                  {item.price} {settings.currency} each
                </span>
                <span className="preview-total-rate">
                  Total: <strong>{itemSubtotal} {settings.currency}</strong>
                </span>
              </div>

              {/* Delivery Meta Summary */}
              <div className="preview-fulfillment-tag">
                <span className="tag-icon">
                  {item.deliveryType === "Pickup" ? "🏬" : "🚚"}
                </span>
                <span className="tag-text">
                  {item.deliveryType === "Pickup" ? "Store Pickup" : `Delivery (${item.distanceKm || 0} km)`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Editable Controls */}
        <div className="details-editor-column">
          {/* 1. Written Name Editor */}
          <div className="editor-card aura-glass">
            <div className="editor-card-header">
              <h3 className="editor-section-title">
                ✍️ Written Name <span className="optional-tag">(Optional)</span>
              </h3>
              <span className={`char-counter ${customText.length >= 7 ? "limit-reached" : ""}`}>
                {customText.length} / 7
              </span>
            </div>
            <p className="editor-section-desc">
              English letters, numbers & spaces only (max 7 characters).
            </p>
            <div className="editor-input-wrap">
              <input
                type="text"
                className="editor-text-input"
                placeholder="e.g. ABEBE"
                value={customText}
                onChange={handleCustomTextChange}
                maxLength={7}
              />
              {customText && (
                <button
                  type="button"
                  className="btn-clear-input"
                  onClick={() => setCustomText("")}
                  title="Clear written name"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* 2. Stickers Selection Editor (2 per row, tabs, sold-out handling) */}
          <div className="editor-card aura-glass">
            <div className="editor-card-header">
              <h3 className="editor-section-title">
                ✨ Customize Stickers
              </h3>
              <span className="selected-count-badge">
                {selectedStickers.length} Selected
              </span>
            </div>

            {/* Sticker Tabs */}
            <div className="details-sticker-tabs">
              <button
                type="button"
                className={`details-tab-btn ${stickerTab === "Mix" ? "active" : ""}`}
                onClick={() => setStickerTab("Mix")}
              >
                🎨 A. Mix ({mixStickers.length})
              </button>
              <button
                type="button"
                className={`details-tab-btn ${stickerTab === "Fixed" ? "active" : ""}`}
                onClick={() => setStickerTab("Fixed")}
              >
                📌 B. Fixed ({fixedStickers.length})
              </button>
            </div>

            {/* Scrollable Sticker Selection Grid (2 per row) */}
            <div className="details-stickers-scroll-wrap">
              <div className="details-stickers-grid">
                {(stickerTab === "Mix" ? mixStickers : fixedStickers).length === 0 ? (
                  <p className="no-stickers-text">
                    No {stickerTab.toLowerCase()} stickers available for this product.
                  </p>
                ) : (
                  (stickerTab === "Mix" ? mixStickers : fixedStickers).map((st) => {
                    const isSelected = selectedStickers.some((s) => s.name === st.name);
                    const isOut = typeof st.stockQuantity === "number" && st.stockQuantity <= 0;
                    return (
                      <div
                        key={st._id}
                        className={`details-sticker-card ${isSelected ? "selected" : ""} ${isOut ? "is-out-of-stock disabled" : ""}`}
                        onClick={() => {
                          if (isOut) {
                            toast.warning(`"${st.name}" is sold out!`);
                            return;
                          }
                          toggleSticker(st);
                        }}
                        title={
                          isOut
                            ? `"${st.name}" is sold out`
                            : isSelected
                            ? `Selected: ${st.name}`
                            : `Select ${st.name}`
                        }
                        aria-disabled={isOut}
                      >
                        <div className="details-sticker-media">
                          <img
                            src={`${url}/images/${st.image}`}
                            alt={st.name}
                            className="details-sticker-img"
                          />
                          {isOut && <span className="details-sold-out-badge">Sold Out</span>}
                          {isSelected && !isOut && (
                            <span className="details-check-icon">✓</span>
                          )}
                        </div>
                        {isSelected && (
                          <div className="details-sticker-name-tag">
                            <span>{st.name}</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Instruction Note below stickers */}
            {stickerTab === "Mix" ? (
              <div className="details-tab-note-box mix-note">
                <span className="note-icon">💡</span>
                <span className="note-text">
                  <strong>Note:</strong> Multiple stickers allowed
                </span>
              </div>
            ) : (
              <div className="details-tab-note-box fixed-note">
                <span className="note-icon">📌</span>
                <span className="note-text">
                  <strong>Note:</strong> Single stickers only
                </span>
              </div>
            )}

            {/* Selected Stickers Summary Box (always visible) */}
            <div className="details-selected-summary">
              <div className="summary-top-bar">
                <span className="summary-title">
                  Selected Stickers ({selectedStickers.length})
                </span>
                {selectedStickers.length > 0 && (
                  <button
                    type="button"
                    className="btn-clear-all-stickers"
                    onClick={() => setSelectedStickers([])}
                  >
                    Clear All
                  </button>
                )}
              </div>

              {selectedStickers.length > 0 ? (
                <div className="summary-chips-wrap">
                  {selectedStickers.map((s, idx) => (
                    <span key={idx} className="summary-sticker-chip">
                      <span className="chip-name">{s.name}</span>
                      <button
                        type="button"
                        className="btn-remove-chip"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSticker(s);
                        }}
                        title={`Remove ${s.name}`}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="summary-empty-hint">
                  No stickers selected yet. Tap any sticker above to select.
                </p>
              )}
            </div>
          </div>

          {/* 3. Quantity Adjuster */}
          <div className="editor-card aura-glass">
            <div className="editor-card-header">
              <h3 className="editor-section-title">📦 Quantity</h3>
              <div className="qty-control-cluster">
                <button
                  type="button"
                  className="btn-circle-qty"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  title="Decrease quantity"
                >
                  −
                </button>
                <span className="qty-value-label">{quantity}</span>
                <button
                  type="button"
                  className="btn-circle-qty"
                  onClick={() => setQuantity((q) => q + 1)}
                  title="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="details-actions-bar aura-glass">
            <div className="actions-total-group">
              <span className="actions-total-label">Subtotal</span>
              <strong className="actions-total-price">
                {itemSubtotal} {settings.currency}
              </strong>
            </div>

            <div className="actions-buttons-group">
              <button
                type="button"
                className="btn-save-cart"
                onClick={handleSaveAndReturn}
              >
                ✓ Save & Return to Cart
              </button>
              <button
                type="button"
                className="btn-proceed-checkout"
                onClick={handleSaveAndCheckout}
              >
                Proceed to Checkout →
              </button>
              <button
                type="button"
                className="btn-remove-item-danger"
                onClick={handleRemove}
                title="Remove this item from your cart"
              >
                Remove Item
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItemDetails;

