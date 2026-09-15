import React, { useState, useContext, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import "./CustomizeModal.css";
import { StoreContext } from "../../context/StoreContext";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet's broken default icon paths in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Colored marker factory
const makeColorIcon = (color) => L.divIcon({
  className: "",
  html: `<div style="width:18px;height:18px;background:${color};border:3px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>`,
  iconAnchor: [9, 9],
  popupAnchor: [0, -9],
});

const CustomizeModal = ({ product, isOpen, onClose }) => {
  const navigate = useNavigate();
  const {
    url,
    stickers_list,
    settings,
    cartItems,
    cartDeliveryInfo,
    clearCart,
    addCustomizedItemToCart,
    calculateDistanceToStore,
    calculateRouteToStore,
    computeDeliveryFee
  } = useContext(StoreContext);

  const hasCartDelivery = cartItems.length > 0 && !!cartDeliveryInfo;
  const [showLocationConflictModal, setShowLocationConflictModal] = useState(false);

  const [customText, setCustomText] = useState("");
  const [fontStyle, setFontStyle] = useState("Serif");
  const [selectedStickers, setSelectedStickers] = useState([]);
  // Quantity is always 1 per cart item — add another item to the cart for more

  // Delivery vs Pickup
  const [deliveryType, setDeliveryType] = useState("Delivery");
  const [customerLocation, setCustomerLocation] = useState("");
  const [customerCoordinates, setCustomerCoordinates] = useState(null);
  const [calculatedDistance, setCalculatedDistance] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [isRouting, setIsRouting] = useState(false);
  const [routeDuration, setRouteDuration] = useState(null);
  const [isRoadRoute, setIsRoadRoute] = useState(false);
  const routingReqRef = useRef(0);

  // Map refs
  const mapRef = useRef(null);         // leaflet map instance
  const mapContainerRef = useRef(null);// DOM container
  const customerMarkerRef = useRef(null);
  const storeMarkerRef = useRef(null);
  const lineRef = useRef(null);

  const storeCoords = settings.storeCoordinates || { lat: 8.9956, lng: 38.7891 };

  // Filter stickers
  const availableStickers = stickers_list.filter((sticker) => {
    if (!product?.stickers || product.stickers.length === 0) return true;
    return product.stickers.includes(sticker.name) || product.stickers.includes(sticker._id);
  });

  // ── LOCK BODY SCROLL & ESC KEY LISTENER ─────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Sync with established cart delivery info when opening modal
  useEffect(() => {
    if (!isOpen) return;
    if (hasCartDelivery && cartDeliveryInfo) {
      setDeliveryType(cartDeliveryInfo.deliveryType || "Delivery");
      setCustomerCoordinates(cartDeliveryInfo.customerCoordinates || null);
      setCustomerLocation(cartDeliveryInfo.customerLocation || "");
      setCalculatedDistance(cartDeliveryInfo.distanceKm || 0);
      setDeliveryFee(cartDeliveryInfo.deliveryFee || 0);
      setRouteDuration(cartDeliveryInfo.routeDuration || null);
      setIsRoadRoute(Boolean(cartDeliveryInfo.routeCoordinates && cartDeliveryInfo.routeCoordinates.length > 0));
    }
  }, [isOpen, hasCartDelivery, cartDeliveryInfo]);

  // ── INITIALIZE MAP ──────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !product || deliveryType !== "Delivery") return;

    // Small delay so the container is visible in the DOM
    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;
      if (mapRef.current) return; // already initialized

      const center = [storeCoords.lat, storeCoords.lng];
      const map = L.map(mapContainerRef.current, {
        center,
        zoom: 13,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Store pin (fixed, red)
      storeMarkerRef.current = L.marker([storeCoords.lat, storeCoords.lng], {
        icon: makeColorIcon("#ef4444"),
        title: settings.storeName || "Store Location",
      }).addTo(map).bindPopup(`<b>📍 ${settings.storeName || "Aura Store"}</b>`);

      mapRef.current = map;

      // If cart already has a location, place its pin and route immediately
      if (hasCartDelivery && cartDeliveryInfo?.customerCoordinates) {
        placeCustomerPin(
          cartDeliveryInfo.customerCoordinates.lat,
          cartDeliveryInfo.customerCoordinates.lng,
          map,
          true
        );
      }

      // Allow clicking the map to drop a delivery pin (if not locked to cart)
      map.on("click", (e) => {
        if (hasCartDelivery) {
          setShowLocationConflictModal(true);
        } else {
          placeCustomerPin(e.latlng.lat, e.latlng.lng, map, false);
        }
      });
    }, 150);

    return () => clearTimeout(timer);
  }, [isOpen, product, deliveryType, hasCartDelivery]);

  // Destroy map when switching to Pickup or closing
  useEffect(() => {
    if (deliveryType === "Pickup" && mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      customerMarkerRef.current = null;
      storeMarkerRef.current = null;
      lineRef.current = null;
    }
  }, [deliveryType]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const placeCustomerPin = async (lat, lng, map, isLocked = false) => {
    const m = map || mapRef.current;
    if (!m) return;

    const coords = { lat: Number(lat.toFixed(5)), lng: Number(lng.toFixed(5)) };
    setCustomerCoordinates(coords);

    // Remove existing customer marker & line
    if (customerMarkerRef.current) {
      customerMarkerRef.current.remove();
    }
    if (lineRef.current) {
      lineRef.current.remove();
    }

    const canDrag = !isLocked && !hasCartDelivery;

    // Place customer pin (blue)
    const marker = L.marker([lat, lng], {
      icon: makeColorIcon("#2563eb"),
      draggable: canDrag,
      title: canDrag ? "Your delivery location (drag to adjust)" : "Shared Cart Delivery Location (Locked)",
    }).addTo(m).bindPopup(
      canDrag
        ? "📍 Your delivery point<br><small>Drag to adjust</small>"
        : "<b>📍 Shared Cart Delivery Location</b><br><small>All items in this cart deliver here</small>"
    );

    if (canDrag) {
      marker.openPopup();
      marker.on("dragend", (e) => {
        const pos = e.target.getLatLng();
        placeCustomerPin(pos.lat, pos.lng, m, false);
      });
    }

    customerMarkerRef.current = marker;

    // Temporary direct polyline while road route is being calculated
    lineRef.current = L.polyline(
      [[storeCoords.lat, storeCoords.lng], [lat, lng]],
      { color: "#2563eb", weight: 3, dashArray: "6 4", opacity: 0.55 }
    ).addTo(m);

    setIsRouting(true);
    if (!hasCartDelivery || !customerLocation) {
      setCustomerLocation(`GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }

    const reqId = ++routingReqRef.current;

    try {
      const route = await calculateRouteToStore(lat, lng);
      // Discard result if user moved pin in the meantime
      if (reqId !== routingReqRef.current) return;

      if (lineRef.current) {
        lineRef.current.remove();
      }

      if (route.isRoadRoute && route.coordinates.length > 0) {
        // Draw the actual driving route along streets
        lineRef.current = L.polyline(route.coordinates, {
          color: "#2563eb",
          weight: 4,
          opacity: 0.85,
          lineJoin: "round",
          lineCap: "round",
        }).addTo(m);
        setIsRoadRoute(true);
        setRouteDuration(route.durationMin);
      } else {
        // Fallback straight dashed line
        lineRef.current = L.polyline(
          [[storeCoords.lat, storeCoords.lng], [lat, lng]],
          { color: "#2563eb", weight: 3, dashArray: "6 4", opacity: 0.65 }
        ).addTo(m);
        setIsRoadRoute(false);
        setRouteDuration(null);
      }

      setCalculatedDistance(route.distanceKm);
      setDeliveryFee(computeDeliveryFee(route.distanceKm));

      // Fit map view smoothly to show the route between store and customer
      if (lineRef.current && m) {
        m.fitBounds(lineRef.current.getBounds(), { padding: [35, 35], maxZoom: 15 });
      }
    } catch (err) {
      if (reqId !== routingReqRef.current) return;
      console.error("Routing error:", err);
      const fallbackDist = calculateDistanceToStore(lat, lng);
      setCalculatedDistance(fallbackDist);
      setDeliveryFee(computeDeliveryFee(fallbackDist));
      setIsRoadRoute(false);
      setRouteDuration(null);
    } finally {
      if (reqId === routingReqRef.current) {
        setIsRouting(false);
      }
    }
  };

  // Reset distance & routing when switching to Pickup
  useEffect(() => {
    if (deliveryType === "Pickup") {
      setCalculatedDistance(0);
      setDeliveryFee(0);
      setIsRoadRoute(false);
      setRouteDuration(null);
    }
  }, [deliveryType]);

  const handleToggleDeliveryType = (type) => {
    if (hasCartDelivery && type !== cartDeliveryInfo.deliveryType) {
      setShowLocationConflictModal(true);
      return;
    }
    setDeliveryType(type);
  };

  const toggleSticker = (sticker) => {
    const exists = selectedStickers.find((s) => s.name === sticker.name);
    if (exists) {
      setSelectedStickers(selectedStickers.filter((s) => s.name !== sticker.name));
    } else {
      setSelectedStickers([...selectedStickers, { name: sticker.name, image: sticker.image, id: sticker._id }]);
    }
  };

  const handleDetectLocation = () => {
    if (hasCartDelivery) {
      setShowLocationConflictModal(true);
      return;
    }
    if (!("geolocation" in navigator)) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setDetectingLocation(false);
        placeCustomerPin(latitude, longitude, null, false);
        // Pan map to user location
        if (mapRef.current) {
          mapRef.current.setView([latitude, longitude], 15);
        }
        toast.success("📍 Location pinned on map! Drag the blue pin to adjust.");
      },
      (error) => {
        setDetectingLocation(false);
        toast.error("Could not get GPS location. Please tap on the map to pin your delivery spot.");
      }
    );
  };

  const handleAddToCart = (directCheckout = false) => {
    if (deliveryType === "Delivery" && !customerCoordinates) {
      toast.error("Please tap on the map to mark your delivery location, or use GPS 📍");
      return;
    }

    const payload = {
      foodId: product._id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1,
      customText,
      selectedStickers,
      deliveryType,
      distanceKm: calculatedDistance,
      deliveryFee,
      customerLocation: deliveryType === "Delivery" ? customerLocation : "Store Pickup",
      customerCoordinates,
    };

    addCustomizedItemToCart(payload);
    onClose();

    if (directCheckout) navigate("/order");
  };

  const itemPrice = product.price;
  const itemTotal = itemPrice + (deliveryType === "Delivery" ? deliveryFee : 0);

  if (!isOpen || !product) return null;

  return ReactDOM.createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="customize-modal-card fade-in" onClick={(e) => e.stopPropagation()}>
        {/* Mobile Grab Bar */}
        <div className="sheet-grab-bar mobile-only">
          <div className="grab-pill"></div>
        </div>

        {/* Header */}
        <div className="customize-modal-header">
          <div className="header-text-block">
            <h2 className="cust-product-title">Customize {product.name}</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="customize-modal-body">
          {/* Top Live Preview Banner */}
          <div className="live-preview-box">
            <div className="preview-image-container">
              <img
                src={`${url}/images/${product.image}`}
                alt={product.name}
                className="preview-base-img"
              />
              {customText && (
                <div className={`live-custom-text-overlay ${fontStyle.toLowerCase()}`}>
                  <span>{customText}</span>
                </div>
              )}
            </div>

            <div className="preview-meta">
              <h3 className="product-modal-name">{product.name}</h3>
              <p className="product-modal-price">
                {product.price} <span className="currency-tag">{settings.currency}</span>
              </p>
              {product.description && (
                <p className="product-modal-desc">{product.description}</p>
              )}

              {selectedStickers.length > 0 && (
                <div className="applied-stickers-preview">
                  <span className="applied-label">Selected Stickers:</span>
                  <div className="applied-chips">
                    {selectedStickers.map((s, idx) => (
                      <span key={idx} className="applied-chip">
                        {s.image && <img src={`${url}/images/${s.image}`} alt="" className="chip-img" />}
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form Sections */}
          <div className="cust-form-sections">
            {/* 1. Custom Text */}
            <div className="cust-section-box">
              <label className="cust-section-title">
                🔤 1. Custom Words to Print on Item
              </label>
              <div className="custom-text-input-wrap">
                <input
                  type="text"
                  maxLength={30}
                  className="form-input custom-print-input"
                  placeholder="e.g. AURA 2026 / YOUR NAME / EST. 94"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                />
                <div className="font-options">
                  {["Serif", "Modern", "Street", "Script"].map((font) => (
                    <button
                      key={font}
                      type="button"
                      className={`font-pill ${fontStyle === font ? "active" : ""}`}
                      onClick={() => setFontStyle(font)}
                    >
                      {font}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Sticker Attachments */}
            <div className="cust-section-box">
              <div className="section-title-row">
                <label className="cust-section-title">
                  ✨ 2. Select Stickers to Apply
                </label>
                <span className="selection-count-badge">
                  {selectedStickers.length} Selected
                </span>
              </div>
              <div className="cust-stickers-grid">
                {availableStickers.length === 0 ? (
                  <p className="no-stickers-note">No stickers available for this item.</p>
                ) : (
                  availableStickers.map((st) => {
                    const isSelected = selectedStickers.some((s) => s.name === st.name);
                    return (
                      <div
                        key={st._id}
                        className={`cust-sticker-card ${isSelected ? "selected" : ""}`}
                        onClick={() => toggleSticker(st)}
                      >
                        <img
                          src={`${url}/images/${st.image}`}
                          alt={st.name}
                          className="cust-sticker-img"
                        />
                        <span className="cust-sticker-name">{st.name}</span>
                        {isSelected && <span className="cust-sticker-badge">✓</span>}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 3. Delivery vs Pickup — Map Picker */}
            <div className="cust-section-box">
              <label className="cust-section-title">
                📍 3. Fulfillment & Delivery Location
              </label>

              {hasCartDelivery && (
                <div className="cart-locked-delivery-banner">
                  <div className="locked-banner-top">
                    <span className="locked-badge-icon">🔒 📍</span>
                    <div className="locked-text-wrap">
                      <h4 className="locked-title">Order Delivery Location (Shared Cart)</h4>
                      <p className="locked-subtitle">
                        All items in one cart deliver to the same address.
                      </p>
                    </div>
                  </div>

                  <div className="locked-details-grid">
                    <div className="locked-detail-pill">
                      <span className="pill-lbl">Fulfillment:</span>
                      <strong>{cartDeliveryInfo.deliveryType === "Pickup" ? "🏬 Store Pickup" : "🚚 Door Delivery"}</strong>
                    </div>
                    {cartDeliveryInfo.deliveryType === "Delivery" && (
                      <>
                        <div className="locked-detail-pill">
                          <span className="pill-lbl">Destination:</span>
                          <strong className="text-truncate">{cartDeliveryInfo.customerLocation || "Pinned Location"}</strong>
                        </div>
                        <div className="locked-detail-pill">
                          <span className="pill-lbl">Route Distance:</span>
                          <strong>{cartDeliveryInfo.distanceKm} km {cartDeliveryInfo.routeDuration ? `(~${cartDeliveryInfo.routeDuration} min drive)` : ""}</strong>
                        </div>
                        <div className="locked-detail-pill highlight">
                          <span className="pill-lbl">Order Delivery Fee:</span>
                          <strong>{cartDeliveryInfo.deliveryFee} {settings.currency}</strong>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="locked-action-row">
                    <button
                      type="button"
                      className="btn-order-diff-location"
                      onClick={() => setShowLocationConflictModal(true)}
                    >
                      🔀 Want to deliver to a different location? (Order Individually)
                    </button>
                  </div>
                </div>
              )}

              <div className="delivery-type-toggle">
                <button
                  type="button"
                  className={`toggle-option ${deliveryType === "Delivery" ? "active" : ""}`}
                  onClick={() => handleToggleDeliveryType("Delivery")}
                  disabled={hasCartDelivery && cartDeliveryInfo.deliveryType !== "Delivery"}
                >
                  🚚 Door Delivery
                </button>
                <button
                  type="button"
                  className={`toggle-option ${deliveryType === "Pickup" ? "active" : ""}`}
                  onClick={() => handleToggleDeliveryType("Pickup")}
                  disabled={hasCartDelivery && cartDeliveryInfo.deliveryType !== "Pickup"}
                >
                  🏬 Store Pickup (Free)
                </button>
              </div>

              {deliveryType === "Delivery" ? (
                <div className="delivery-calc-details">
                  {/* Map instructions + GPS button */}
                  <div className="map-instruction-row">
                    <p className="map-hint">
                      {hasCartDelivery ? (
                        <span><strong>Shared Cart Location:</strong> Pin is locked to your current cart. To change address, order individually below.</span>
                      ) : (
                        <span><strong>Tap anywhere on the map</strong> to pin your delivery location. Drag the blue pin to fine-tune.</span>
                      )}
                    </p>
                    {!hasCartDelivery && (
                      <button
                        type="button"
                        className="btn-gps-detect"
                        onClick={handleDetectLocation}
                        disabled={detectingLocation}
                      >
                        {detectingLocation ? "Locating…" : "📍 Use My GPS"}
                      </button>
                    )}
                  </div>

                  {/* Leaflet Map Container */}
                  <div
                    ref={mapContainerRef}
                    className={`delivery-map-container ${hasCartDelivery ? "locked-map" : ""}`}
                    id="delivery-map"
                  />

                  {/* Map legend */}
                  <div className="map-legend-row">
                    <span className="legend-dot red"></span><span>Store</span>
                    <span className="legend-dot blue"></span><span>{hasCartDelivery ? "Cart delivery point (Shared)" : "Your delivery point"}</span>
                    {isRoadRoute && (
                      <>
                        <span className="legend-line blue"></span><span>Road Route</span>
                      </>
                    )}
                  </div>

                  {/* Optional address note */}
                  {!hasCartDelivery && (
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Add a note about your location (e.g. Bole, near X building) — optional"
                      value={customerCoordinates ? customerLocation : ""}
                      onChange={(e) => setCustomerLocation(e.target.value)}
                    />
                  )}

                  {/* Distance & Fee summary */}
                  <div className="distance-fee-card">
                    <div className="metric-col">
                      <span className="metric-label">Store Location:</span>
                      <strong className="metric-val text-truncate">{settings.storeAddress}</strong>
                    </div>
                    <div className="metric-col">
                      <span className="metric-label">Route Distance:</span>
                      <div className="metric-val highlight">
                        {isRouting ? (
                          <span className="routing-spinner-wrap">
                            <span className="routing-spinner"></span> Routing...
                          </span>
                        ) : calculatedDistance > 0 ? (
                          <div className="route-metric-wrap">
                            <span>{calculatedDistance} km</span>
                            <span className="route-badge">
                              {isRoadRoute
                                ? routeDuration
                                  ? `🚗 ~${routeDuration} min drive`
                                  : "🚗 Road route"
                                : "📏 Straight-line"}
                            </span>
                          </div>
                        ) : (
                          "— Pin not set"
                        )}
                      </div>
                    </div>
                    <div className="metric-col fee-col">
                      <span className="metric-label">Delivery Fee:</span>
                      <strong className="metric-fee">
                        {deliveryFee > 0 ? `${deliveryFee} ${settings.currency}` : "—"}
                      </strong>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="pickup-info-box">
                  <p>📍 <strong>Store Address:</strong> {settings.storeAddress}</p>
                  <p className="pickup-note">No delivery charge. Pick up your custom printed order directly from our store.</p>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Sticky Footer — Price + Actions */}
        <div className="customize-modal-footer">
          <div className="footer-price-breakdown">
            <div className="total-line-row">
              <span className="breakdown-label">Item Total:</span>
              <span className="breakdown-val">
                {itemPrice} <span className="currency-unit">{settings.currency}</span>
              </span>
            </div>
            {hasCartDelivery ? (
              <span className="prepay-settle-hint">
                🚚 Delivery fee ({cartDeliveryInfo.deliveryFee} {settings.currency}) & Prepayment settled at checkout
              </span>
            ) : deliveryType === "Delivery" && deliveryFee > 0 ? (
              <span className="prepay-settle-hint">
                🚚 Delivery fee: {deliveryFee} {settings.currency} (applied once to order) • Prepayment at checkout
              </span>
            ) : (
              <span className="prepay-settle-hint">💳 Prepayment (ቀብድ) settled at checkout</span>
            )}
          </div>

          <div className="footer-action-buttons">
            <button
              type="button"
              className="btn-add-cart"
              onClick={() => handleAddToCart(false)}
            >
              Add to Cart
            </button>
            <button
              type="button"
              className="btn-proceed-checkout"
              onClick={() => handleAddToCart(true)}
            >
              Order & Pay →
            </button>
          </div>
        </div>

        {/* Single Delivery Location Conflict Modal */}
        {showLocationConflictModal && (
          <div className="conflict-modal-overlay" onClick={() => setShowLocationConflictModal(false)}>
            <div className="conflict-modal-card fade-in" onClick={(e) => e.stopPropagation()}>
              <div className="conflict-modal-header">
                <span className="conflict-icon">📍</span>
                <h3>Single Delivery Location Per Order</h3>
                <button
                  type="button"
                  className="conflict-close-btn"
                  onClick={() => setShowLocationConflictModal(false)}
                >
                  ✕
                </button>
              </div>

              <div className="conflict-modal-body">
                <p className="conflict-primary-msg">
                  All items in one cart must be delivered to the <strong>same location</strong>.
                </p>
                <div className="conflict-current-box">
                  <span className="conflict-box-lbl">Current Cart Location:</span>
                  <strong>{cartDeliveryInfo?.customerLocation || "Pinned delivery location"}</strong>
                  <small>({cartItems.length} item{cartItems.length > 1 ? "s" : ""} currently in cart)</small>
                </div>
                <p className="conflict-secondary-msg">
                  If you want to send items to a <strong>different location</strong>, they must be ordered individually. What would you like to do?
                </p>
              </div>

              <div className="conflict-modal-actions">
                <button
                  type="button"
                  className="btn-conflict-checkout"
                  onClick={() => {
                    setShowLocationConflictModal(false);
                    onClose();
                    navigate("/order");
                  }}
                >
                  1️⃣ Checkout Current Order First ({cartItems.length} item{cartItems.length > 1 ? "s" : ""}) →
                </button>
                <button
                  type="button"
                  className="btn-conflict-clear"
                  onClick={() => {
                    clearCart();
                    setShowLocationConflictModal(false);
                    setCustomerCoordinates(null);
                    setCustomerLocation("");
                    setCalculatedDistance(0);
                    setDeliveryFee(0);
                    if (customerMarkerRef.current) customerMarkerRef.current.remove();
                    if (lineRef.current) lineRef.current.remove();
                    toast.info("Cart cleared. You can now set a new location for this individual order.");
                  }}
                >
                  2️⃣ Start Fresh Order (Clear Cart & Pin New Location)
                </button>
                <button
                  type="button"
                  className="btn-conflict-cancel"
                  onClick={() => setShowLocationConflictModal(false)}
                >
                  Keep Current Cart Location
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default CustomizeModal;
