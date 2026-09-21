import React, { useContext, useState, useEffect } from "react";
import "./PlaceOrder.css";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate, Link } from "react-router-dom";

const PlaceOrder = () => {
  const navigate = useNavigate();
  const {
    url,
    cartItems,
    cartDeliveryInfo,
    clearCart,
    getCartSubtotal,
    getCartDeliveryFee,
    getTotalCartAmount,
    getTotalItemCount,
    computePrepayment,
    settings
  } = useContext(StoreContext);


  // Customer Information
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);

  // Payment Selection & Proof Upload
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [selectedPaymentAccount, setSelectedPaymentAccount] = useState("");
  const [paymentProofFile, setPaymentProofFile] = useState(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [copiedRef, setCopiedRef] = useState(false);

  // State after successful submission
  const [submittedOrder, setSubmittedOrder] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const subtotal = getCartSubtotal();
  const deliveryFee = getCartDeliveryFee();
  const configuredUrgentFee = settings.urgentFee !== undefined ? settings.urgentFee : 100;
  const urgentFee = isUrgent ? configuredUrgentFee : 0;
  const total = subtotal + deliveryFee + urgentFee;
  const totalItemCount = getTotalItemCount ? getTotalItemCount() : cartItems.reduce((s, i) => s + i.quantity, 0);

  // When toggling urgent order, auto-set date to today
  const handleUrgentToggle = (checked) => {
    setIsUrgent(checked);
    if (checked) {
      const todayStr = new Date().toISOString().split("T")[0];
      setDeliveryDate(todayStr);
      toast.info(`⚡ Urgent Same-Day Order enabled (+${configuredUrgentFee} ${settings.currency})`);
    }
  };

  // Minimum required prepayment deposit (per item or configured default, capped at total)
  const minDeposit = Math.min(
    total,
    computePrepayment
      ? computePrepayment(totalItemCount)
      : (settings.prepaymentPerItem ?? 500) * totalItemCount
  );

  // Customer settles prepayment on this Order & Pay page (defaults to minDeposit)
  const [chosenPrepayment, setChosenPrepayment] = useState(null);

  const effectivePrepayment = chosenPrepayment !== null
    ? Math.min(total, Math.max(minDeposit, chosenPrepayment))
    : minDeposit;

  const remainingBalance = Math.max(0, total - effectivePrepayment);


  // Determine delivery type from cart
  const deliveryType = cartDeliveryInfo?.deliveryType || (cartItems.some((i) => i.deliveryType === "Delivery") ? "Delivery" : "Pickup");

  // Pre-fill location if any in cart
  useEffect(() => {
    if (cartDeliveryInfo?.customerLocation && cartDeliveryInfo.customerLocation !== "Store Pickup") {
      setDeliveryAddress(cartDeliveryInfo.customerLocation);
    } else if (cartItems.length > 0) {
      const itemWithLoc = cartItems.find((i) => i.customerLocation && i.customerLocation !== "Store Pickup");
      if (itemWithLoc) {
        setDeliveryAddress(itemWithLoc.customerLocation);
      }
    }
  }, [cartDeliveryInfo, cartItems]);

  // Set default payment method once settings load
  useEffect(() => {
    if (settings.paymentMethods && settings.paymentMethods.length > 0 && !selectedPaymentMethod) {
      const firstActive = settings.paymentMethods.find((pm) => pm.active) || settings.paymentMethods[0];
      setSelectedPaymentMethod(firstActive.provider);
      setSelectedPaymentAccount(firstActive.accountNumber);
    }
  }, [settings]);

  // 1-Click Copy Handler
  const handleCopyAccount = (accountNumber, id) => {
    navigator.clipboard.writeText(accountNumber);
    setCopiedId(id);
    toast.success(`Copied "${accountNumber}" to clipboard!`);
    setTimeout(() => {
      setCopiedId(null);
    }, 2500);
  };

  const handleCopyOrderRef = (ref) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(true);
    toast.success(`Order ID "${ref}" copied!`);
    setTimeout(() => setCopiedRef(false), 2500);
  };

  // Payment Screenshot Upload Handler
  const handleProofChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Screenshot exceeds 10MB limit. Please choose a smaller image.");
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg", "image/gif", "image/svg+xml"];
    if (!validTypes.includes(file.type.toLowerCase())) {
      toast.error("Please upload an image screenshot (JPEG, PNG, WEBP).");
      return;
    }

    setPaymentProofFile(file);
    setPaymentProofPreview(URL.createObjectURL(file));
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();

    if (!customerName.trim() || !customerPhone.trim()) {
      toast.error("Please provide your name and phone number");
      return;
    }

    if (!deliveryDate) {
      toast.error(`Please select your preferred ${deliveryType === "Pickup" ? "pickup" : "delivery"} date`);
      return;
    }

    if (deliveryType === "Delivery" && !deliveryAddress.trim()) {
      toast.error("Please provide your delivery address or area");
      return;
    }

    if (!paymentProofFile) {
      toast.error("Please upload your transfer screenshot (Proof of Payment)");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("customerName", customerName.trim());
      formData.append("customerPhone", customerPhone.trim());
      formData.append("customerEmail", customerEmail.trim());
      formData.append("deliveryType", deliveryType);
      formData.append("deliveryDate", deliveryDate);
      formData.append("deliveryAddress", deliveryAddress.trim());
      formData.append("distanceKm", cartDeliveryInfo?.distanceKm || cartItems[0]?.distanceKm || 0);
      formData.append("deliveryFee", deliveryFee);
      formData.append("isUrgent", isUrgent);
      formData.append("urgentFee", urgentFee);
      formData.append("subtotal", subtotal);
      formData.append("totalAmount", total);
      formData.append("prepaymentAmount", effectivePrepayment);
      formData.append("paymentMethod", selectedPaymentMethod);
      formData.append("paymentAccount", selectedPaymentAccount);
      formData.append("notes", notes.trim());
      formData.append("paymentProof", paymentProofFile);
      formData.append("items", JSON.stringify(cartItems));

      const res = await axios.post(`${url}/api/order/submit`, formData);
      if (res.data.success) {
        setSubmittedOrder(res.data.order);
        clearCart();
        toast.success("Order placed successfully! Admin will verify your transfer proof.");
      } else {
        toast.error(res.data.message || "Failed to submit order");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Error submitting order");
    } finally {
      setSubmitting(false);
    }
  };

  // If order was successfully placed, render Order Confirmation
  if (submittedOrder) {
    const isSubmittedUrgent = submittedOrder.isUrgent;
    const storeContactPhone = settings.storePhone || "+251 911 223 344";

    return (
      <div className="order-success-view aura-glass fade-in">
        <div className="success-badge-icon">🎉</div>
        <h1 className="success-main-title">Order Submitted Successfully!</h1>
        <p className="success-subtitle">
          Your payment screenshot has been attached and submitted for verification & custom printing.
        </p>

        {/* Urgent Call-To-Action Banner */}
        {isSubmittedUrgent && (
          <div className="urgent-receipt-banner">
            <div className="urgent-badge-pill">⚡ URGENT SAME-DAY ORDER</div>
            <h3 className="urgent-alert-title">🚨 Call Seller to Fast-Track Your Order!</h3>
            <p className="urgent-alert-text">
              Because you requested an <strong>Urgent Same-Day Order</strong>, please call the seller immediately with Order ID <strong>#{submittedOrder.orderNumber}</strong> so production and dispatch start without delay!
            </p>
            <a href={`tel:${storeContactPhone.replace(/\s+/g, '')}`} className="btn-call-seller-urgent">
              📞 Call Seller Now ({storeContactPhone})
            </a>
          </div>
        )}

        <div className="order-receipt-card">
          <div className="receipt-header">
            <span className="receipt-label">Order Reference</span>
            <div className="receipt-order-id-wrap">
              <strong className="receipt-order-id">{submittedOrder.orderNumber}</strong>
              {isSubmittedUrgent && <span className="urgent-tag-small">⚡ Urgent</span>}
              <button
                type="button"
                className="btn-copy-receipt-ref"
                onClick={() => handleCopyOrderRef(submittedOrder.orderNumber)}
              >
                {copiedRef ? "✓ Copied" : "📋 Copy"}
              </button>
            </div>
          </div>

          <div className="receipt-meta-grid">
            <div className="receipt-meta-item">
              <span className="meta-label">Customer Name</span>
              <strong className="meta-val">{submittedOrder.customerName}</strong>
            </div>
            <div className="receipt-meta-item">
              <span className="meta-label">Phone Number</span>
              <strong className="meta-val">{submittedOrder.customerPhone}</strong>
            </div>
            <div className="receipt-meta-item">
              <span className="meta-label">Fulfillment</span>
              <strong className="meta-val">{submittedOrder.deliveryType}</strong>
            </div>
            {submittedOrder.deliveryDate && (
              <div className="receipt-meta-item">
                <span className="meta-label">Target Date</span>
                <strong className="meta-val highlight" style={{ color: isSubmittedUrgent ? "#b45309" : "#d97706" }}>
                  {isSubmittedUrgent ? "⚡ Today (Same-Day Express)" : `📅 ${submittedOrder.deliveryDate}`}
                </strong>
              </div>
            )}
            <div className="receipt-meta-item">
              <span className="meta-label">Total Amount</span>
              <strong className="meta-val">
                {submittedOrder.totalAmount} {settings.currency}
              </strong>
            </div>
            <div className="receipt-meta-item">
              <span className="meta-label">Prepayment (ቀብድ)</span>
              <strong className="meta-val highlight" style={{ color: "#10b981" }}>
                {submittedOrder.prepaymentAmount || 0} {settings.currency}
              </strong>
            </div>
            <div className="receipt-meta-item">
              <span className="meta-label">Balance on Delivery</span>
              <strong className="meta-val" style={{ color: "#f59e0b" }}>
                {Math.max(0, (submittedOrder.totalAmount || 0) - (submittedOrder.prepaymentAmount || 0))} {settings.currency}
              </strong>
            </div>
          </div>

          <div className="receipt-items-summary">
            <h4 className="receipt-items-heading">Customized Items ({submittedOrder.items?.length})</h4>
            {submittedOrder.items?.map((item, idx) => (
              <div key={idx} className="receipt-item-row">
                <div className="receipt-item-left">
                  <span>{item.quantity}x</span>
                  <strong>{item.name}</strong>
                  {item.customText && (
                    <span className="receipt-print-tag">"{item.customText}"</span>
                  )}
                </div>
                <span>{item.price * item.quantity} {settings.currency}</span>
              </div>
            ))}
            {isSubmittedUrgent && (
              <div className="receipt-item-row urgent-item-row">
                <div className="receipt-item-left">
                  <strong>⚡ Urgent Same-Day Express Surcharge</strong>
                </div>
                <span>+{submittedOrder.urgentFee || configuredUrgentFee} {settings.currency}</span>
              </div>
            )}
          </div>
        </div>

        <div className="success-actions-row">
          <Link
            to={`/track?query=${submittedOrder.orderNumber}`}
            className="btn-track-order"
          >
            Track Order Status →
          </Link>
          <Link to="/" className="btn-return-home">
            Continue Browsing Collection
          </Link>
        </div>
      </div>
    );
  }

  // If cart is empty and not submitted
  if (cartItems.length === 0) {
    return (
      <div className="empty-cart-view aura-glass fade-in">
        <div className="empty-cart-icon">🛍️</div>
        <h2>No Items to Checkout</h2>
        <p>Your cart is empty. Choose and customize items first.</p>
        <Link to="/" className="btn-browse-collection">
          Browse Collection
        </Link>
      </div>
    );
  }

  const activePaymentMethods = (settings.paymentMethods || []).filter((pm) => pm.active);
  const storePhoneDisplay = settings.storePhone || "+251 911 223 344";

  return (
    <div className="place-order-page fade-in">
      <div className="checkout-header">
        <h1 className="page-heading">Pre-Payment & Order Submission</h1>
        <p className="page-subheading">
          Complete transfer to any of our official accounts, attach your payment screenshot, and submit for fulfillment
        </p>
      </div>

      <form onSubmit={handleSubmitOrder} className="checkout-grid-layout">
        {/* Left Column: Customer & Delivery Info */}
        <div className="checkout-left-col">
          <div className="checkout-section-card aura-glass">
            <h2 className="section-card-title">👤 1. Customer & Delivery Information</h2>
            <div className="form-fields-group">
              <div className="form-group">
                <label className="form-label">Full Name <span className="label-req">*</span></label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Dawit Tadesse"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Phone Number <span className="label-req">*</span></label>
                  <input
                    type="tel"
                    inputMode="tel"
                    className="form-input"
                    placeholder="e.g. 0911223344"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email (Optional)</label>
                  <input
                    type="email"
                    inputMode="email"
                    className="form-input"
                    placeholder="e.g. user@gmail.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* ⚡ Urgent Same-Day Order Toggle Card */}
              <div className={`urgent-order-card ${isUrgent ? "active" : ""}`}>
                <div className="urgent-toggle-top">
                  <label className="urgent-checkbox-label">
                    <input
                      type="checkbox"
                      className="urgent-checkbox-input"
                      checked={isUrgent}
                      onChange={(e) => handleUrgentToggle(e.target.checked)}
                    />
                    <div className="urgent-checkbox-custom">
                      {isUrgent && <span>✓</span>}
                    </div>
                    <div className="urgent-label-text">
                      <div className="urgent-title-row">
                        <span className="urgent-bolt-icon">⚡</span>
                        <strong className="urgent-title">Urgent Order (Same-Day Express)</strong>
                        <span className="urgent-fee-tag">+{configuredUrgentFee} {settings.currency}</span>
                      </div>
                      <p className="urgent-subtext">
                        Need it done and delivered today? Priority queue printing & express same-day dispatch.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Important recommendation to call seller */}
                {isUrgent && (
                  <div className="urgent-call-recommendation">
                    <div className="rec-header">
                      <span className="rec-icon">📞</span>
                      <strong className="rec-title">Please Call to Notify the Seller:</strong>
                    </div>
                    <p className="rec-body">
                      For guaranteed same-day delivery, please call or WhatsApp the seller directly at{" "}
                      <a href={`tel:${storePhoneDisplay.replace(/\s+/g, '')}`} className="rec-phone-link">
                        <strong>{storePhoneDisplay}</strong>
                      </a>{" "}
                      after submitting this order to fast-track your priority preparation!
                    </p>
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    📅 {deliveryType === "Pickup" ? "Needed / Pickup Date" : "Preferred Delivery Date"} <span className="label-req">*</span>
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    min={new Date().toISOString().split("T")[0]}
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    disabled={isUrgent}
                    required
                  />
                  {isUrgent && (
                    <span className="urgent-date-hint">⚡ Locked to Today for Same-Day fulfillment</span>
                  )}
                </div>

                {deliveryType === "Delivery" ? (
                  <div className="form-group">
                    <label className="form-label">Delivery Address / Drop-off Details <span className="label-req">*</span></label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Bole Medhanialem, next to Edna Mall, House #142"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      required
                    />
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="form-label">Pickup Location</label>
                    <input
                      type="text"
                      className="form-input pickup-loc-readonly"
                      value="🏬 Aura Store Pickup (Addis Ababa)"
                      readOnly
                      disabled
                    />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Order Notes / Printing Instructions (Optional)</label>
                <textarea
                  rows="2"
                  className="form-input"
                  placeholder="Specific placement details, gift wrapping notes, or delivery timing preferences..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 2. Settle Prepayment (ቀብድ) Amount */}
          <div className="checkout-section-card aura-glass prepay-checkout-card">
            <div className="section-card-header-row">
              <h2 className="section-card-title">💰 2. Settle Prepayment (ቀብድ)</h2>
              <span className="min-deposit-pill">Min Deposit: {minDeposit} {settings.currency}</span>
            </div>

            <p className="payment-instructions-sub">
              To begin production of your custom items, a minimum deposit of <strong>{minDeposit} {settings.currency}</strong> is required. You can pay the minimum now or pay the full order amount upfront.
            </p>

            <div className="prepay-settle-box">
              <div className="prepay-settle-controls">
                <div className="prepay-amount-input-block">
                  <label className="prepay-field-label">Prepayment (ቀብድ) to Transfer Now:</label>
                  <div className="prepay-amount-input-wrap">
                    <input
                      type="number"
                      className="prepay-amount-input"
                      min={minDeposit}
                      max={total}
                      value={chosenPrepayment !== null ? chosenPrepayment : minDeposit}
                      onChange={(e) => setChosenPrepayment(Number(e.target.value))}
                      onBlur={(e) => {
                        const val = Number(e.target.value);
                        if (val < minDeposit) setChosenPrepayment(minDeposit);
                        else if (val > total) setChosenPrepayment(total);
                      }}
                    />
                    <span className="prepay-amount-currency">{settings.currency}</span>
                  </div>
                </div>

                <div className="prepay-presets-block">
                  <label className="prepay-field-label">Quick Presets:</label>
                  <div className="prepay-presets-row">
                    <button
                      type="button"
                      className={`btn-prepay-preset ${chosenPrepayment === minDeposit || chosenPrepayment === null ? "active" : ""}`}
                      onClick={() => setChosenPrepayment(minDeposit)}
                    >
                      Min Deposit ({minDeposit} {settings.currency})
                    </button>
                    <button
                      type="button"
                      className={`btn-prepay-preset ${chosenPrepayment === total ? "active" : ""}`}
                      onClick={() => setChosenPrepayment(total)}
                    >
                      Full Total ({total} {settings.currency})
                    </button>
                  </div>
                </div>
              </div>

              {/* Prepayment Summary Cards */}
              <div className="prepay-summary-grid">
                <div className="prepay-sum-card deposit-now">
                  <span className="sum-label">✅ To Transfer Now (ቀብድ)</span>
                  <strong className="sum-amount">{effectivePrepayment} {settings.currency}</strong>
                  <span className="sum-desc">Upload screenshot below</span>
                </div>
                <div className="prepay-sum-card balance-later">
                  <span className="sum-label">📦 Remaining on {deliveryType}</span>
                  <strong className="sum-amount">{remainingBalance} {settings.currency}</strong>
                  <span className="sum-desc">Collect upon handover</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Official Payment Accounts with 1-Click Copy */}
          <div className="checkout-section-card aura-glass">
            <div className="section-card-header-row">
              <h2 className="section-card-title">💳 3. Official Payment Methods</h2>
              <span className="copy-hint-pill">1-Click Copy</span>
            </div>
            <p className="payment-instructions-sub">
              Transfer your declared prepayment deposit (<strong>{effectivePrepayment} {settings.currency}</strong>) to any of the accounts below:
            </p>

            <div className="payment-accounts-list">
              {activePaymentMethods.map((pm, idx) => {
                const isSelected = selectedPaymentMethod === pm.provider;
                const isCopied = copiedId === pm._id || copiedId === idx;
                return (
                  <div
                    key={pm._id || idx}
                    className={`payment-option-card ${isSelected ? "selected" : ""}`}
                    onClick={() => {
                      setSelectedPaymentMethod(pm.provider);
                      setSelectedPaymentAccount(pm.accountNumber);
                    }}
                  >
                    <div className="pm-card-top">
                      <div className="pm-card-title-wrap">
                        <span className="pm-radio-circle"></span>
                        <strong className="pm-card-provider">{pm.provider}</strong>
                      </div>

                      <button
                        type="button"
                        className={`btn-copy-account ${isCopied ? "copied" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyAccount(pm.accountNumber, pm._id || idx);
                        }}
                      >
                        {isCopied ? "✓ Copied!" : "📋 Copy Number"}
                      </button>
                    </div>

                    <div className="pm-card-data-row">
                      <div className="pm-data-item">
                        <span className="pm-data-label">Account Name:</span>
                        <span className="pm-data-val">{pm.accountName}</span>
                      </div>
                      <div className="pm-data-item">
                        <span className="pm-data-label">Account Number:</span>
                        <span className="pm-data-val code-font">{pm.accountNumber}</span>
                      </div>
                    </div>

                    {pm.instructions && (
                      <p className="pm-instruction-note">💡 {pm.instructions}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Upload Proof & Final Submission */}
        <div className="checkout-right-col">
          {/* Order Summary Box */}
          <div className="checkout-summary-box aura-glass">
            <h3 className="summary-card-heading">Order Breakdown</h3>
            <div className="summary-items-preview">
              {cartItems.map((item) => (
                <div key={item.cartItemId} className="summary-item-line">
                  <div className="item-text-info">
                    <strong>{item.quantity}x {item.name}</strong>
                    {item.customText && (
                      <span className="summary-custom-text">Print: "{item.customText}"</span>
                    )}
                    {item.selectedStickers && item.selectedStickers.length > 0 && (
                      <span className="summary-stickers-text">
                        ✨ {item.selectedStickers.map((s) => s.name).join(", ")}
                      </span>
                    )}
                  </div>
                  <span className="item-line-price">
                    {item.price * item.quantity} {settings.currency}
                  </span>
                </div>
              ))}
            </div>

            <div className="summary-totals-block">
              <div className="total-detail-line">
                <span>Items Subtotal:</span>
                <span>{subtotal} {settings.currency}</span>
              </div>
              <div className="total-detail-line">
                <span>Delivery Fee ({deliveryType}):</span>
                <span>{deliveryFee > 0 ? `${deliveryFee} ${settings.currency}` : "0 " + settings.currency}</span>
              </div>
              {isUrgent && (
                <div className="total-detail-line urgent-fee-line">
                  <span>⚡ Urgent Same-Day Fee:</span>
                  <span className="urgent-fee-amount">+{urgentFee} {settings.currency}</span>
                </div>
              )}
              <div className="total-detail-line final-total-line">
                <span>Total Due:</span>
                <span className="grand-total-val">
                  {total} {settings.currency}
                </span>
              </div>
              {effectivePrepayment > 0 && (
                <>
                  <div className="total-detail-line prepayment-line">
                    <span>💰 ቀብድ (Pay Now):</span>
                    <span className="prepay-now-val">{effectivePrepayment} {settings.currency}</span>
                  </div>
                  <div className="total-detail-line remaining-line">
                    <span>🕒 Remaining on {deliveryType}:</span>
                    <span className="remaining-now-val">{remainingBalance} {settings.currency}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Payment Proof Upload Card */}
          <div className="payment-proof-card aura-glass">
            <div className="proof-header">
              <h3 className="proof-title">🧾 Upload Payment Screenshot</h3>
              <span className="label-req">* Required</span>
            </div>
            <p className="proof-desc">
              Attach screenshot confirming transfer of <strong>{effectivePrepayment} {settings.currency}</strong> to {selectedPaymentMethod || "Aura"} (&lt; 10MB)
            </p>

            <div className="proof-dropzone">
              <input
                type="file"
                id="payment-proof-input"
                accept="image/*"
                onChange={handleProofChange}
                hidden
              />
              <label htmlFor="payment-proof-input" className="proof-dropzone-label">
                {paymentProofPreview ? (
                  <div className="proof-preview-container">
                    <img src={paymentProofPreview} alt="Transfer Proof Preview" className="proof-img-tag" />
                    <div className="proof-change-overlay">Click to change screenshot</div>
                  </div>
                ) : (
                  <div className="proof-empty-container">
                    <span className="proof-icon">📷</span>
                    <strong className="proof-upload-title">Click to Upload Transfer Screenshot</strong>
                    <span className="proof-upload-sub">Supports JPG, PNG, WEBP (&lt; 10MB)</span>
                  </div>
                )}
              </label>
            </div>

            <button
              type="submit"
              className="btn-submit-order"
              disabled={submitting}
            >
              {submitting ? "Submitting Order..." : `Submit Order — Pay ቀብድ ${effectivePrepayment} ${settings.currency} Now`}
            </button>

            <p className="instant-verification-note">
              🔒 Once submitted, your order will be verified and prepared for fulfillment immediately.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PlaceOrder;
