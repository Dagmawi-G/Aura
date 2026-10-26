import React, { useEffect, useState, useRef } from "react";
import ReactDOM from "react-dom";
import "./Settings.css";
import axios from "axios";
import { toast } from "react-toastify";
import BankLogo from "../../components/BankLogos/BankLogos";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet's broken default icon paths in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const makeStoreMarkerIcon = () =>
  L.divIcon({
    className: "admin-store-pin",
    html: `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        filter: drop-shadow(0 4px 8px rgba(0,0,0,0.35));
        cursor: grab;
      ">
        <div style="
          background: #ef4444;
          color: #ffffff;
          font-weight: 700;
          font-size: 11px;
          padding: 3px 8px;
          border-radius: 12px;
          border: 2px solid #ffffff;
          white-space: nowrap;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          margin-bottom: 2px;
        ">
          🏬 Store Origin
        </div>
        <div style="
          width: 18px;
          height: 18px;
          background: #ef4444;
          border: 3px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 2px 5px rgba(0,0,0,0.35);
        "></div>
      </div>
    `,
    iconSize: [96, 46],
    iconAnchor: [48, 42],
    popupAnchor: [0, -42],
  });

const Settings = ({ url }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
    storeName: "Aura collection",
    storeAddress: "Bole Medhanialem, Addis Ababa, Ethiopia",
    storeCoordinates: { lat: 8.9956, lng: 38.7891 },
    deliveryTiers: { under5: 200, between5and10: 350, between10and15: 500, over15: 700 },
    urgentFee: 100,
    storePhone: "+251 911 223 344",
    prepaymentPerItem: 500,
    currency: "ETB",
    paymentMethods: []
  });

  // Map refs & states
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const storeMarkerRef = useRef(null);
  const [detectingLocation, setDetectingLocation] = useState(false);

  // Modal / Form state for adding new payment method
  const [showAddMethod, setShowAddMethod] = useState(false);
  const [newMethod, setNewMethod] = useState({
    provider: "Telebirr",
    accountName: "",
    accountNumber: "",
    instructions: "",
    active: true
  });

  // Edit state for inline payment method editing
  const [editingIndex, setEditingIndex] = useState(null);
  const [editMethod, setEditMethod] = useState(null);
  // Inline delete confirmation (replaces window.confirm)
  const [pendingDeleteIndex, setPendingDeleteIndex] = useState(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${url}/api/setting`);
      if (res.data.success) {
        const data = res.data.data;
        // Ensure 4 deliveryTiers exist
        if (!data.deliveryTiers || data.deliveryTiers.under5 === undefined) {
          data.deliveryTiers = {
            under5: data.deliveryTiers?.under5 ?? 200,
            between5and10: data.deliveryTiers?.between5and10 ?? 350,
            between10and15: data.deliveryTiers?.between10and15 ?? 500,
            over15: data.deliveryTiers?.over15 ?? 700
          };
        }
        if (data.urgentFee === undefined) {
          data.urgentFee = 100;
        }
        if (!data.storePhone) {
          data.storePhone = "+251 911 223 344";
        }
        if (data.prepaymentPerItem === undefined) {
          data.prepaymentPerItem = 500;
        }
        setSettings(data);
      }
    } catch (e) {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Helper to place or update store pin
  const placeStorePin = (lat, lng, pan = false) => {
    const numLat = parseFloat(lat);
    const numLng = parseFloat(lng);
    if (isNaN(numLat) || isNaN(numLng)) return;

    const roundedLat = Number(numLat.toFixed(5));
    const roundedLng = Number(numLng.toFixed(5));

    setSettings((prev) => ({
      ...prev,
      storeCoordinates: { lat: roundedLat, lng: roundedLng }
    }));

    if (mapRef.current) {
      if (storeMarkerRef.current) {
        storeMarkerRef.current.setLatLng([roundedLat, roundedLng]);
      } else {
        const marker = L.marker([roundedLat, roundedLng], {
          icon: makeStoreMarkerIcon(),
          draggable: true,
          title: "Store Location (drag to adjust)"
        }).addTo(mapRef.current);

        marker.bindPopup(`<b>🏬 Store Location</b><br><small>Drag to adjust precise location</small>`);

        marker.on("dragend", (e) => {
          const pos = e.target.getLatLng();
          placeStorePin(pos.lat, pos.lng, false);
          toast.info("📍 Store pin moved!");
        });

        storeMarkerRef.current = marker;
      }

      if (pan) {
        mapRef.current.setView([roundedLat, roundedLng], 15);
      }
    }
  };

  // Initialize Map when loading finishes
  useEffect(() => {
    if (loading) return;

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;
      if (mapRef.current) {
        mapRef.current.invalidateSize();
        return;
      }

      const initialLat = settings.storeCoordinates?.lat || 8.9956;
      const initialLng = settings.storeCoordinates?.lng || 38.7891;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 14,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Create draggable store marker
      const marker = L.marker([initialLat, initialLng], {
        icon: makeStoreMarkerIcon(),
        draggable: true,
        title: "Store Location (drag to adjust)"
      }).addTo(map);

      marker.bindPopup(`<b>🏬 Store Location</b><br><small>Drag pin to fine-tune</small>`);

      marker.on("dragend", (e) => {
        const pos = e.target.getLatLng();
        placeStorePin(pos.lat, pos.lng, false);
        toast.info("📍 Store pin moved!");
      });

      // Clicking anywhere on map places/moves store pin
      map.on("click", (e) => {
        placeStorePin(e.latlng.lat, e.latlng.lng, false);
        toast.success("📍 Store location pinned on map! Drag to fine-tune.");
      });

      storeMarkerRef.current = marker;
      mapRef.current = map;
    }, 250);

    return () => clearTimeout(timer);
  }, [loading]);

  // Clean up map when component unmounts
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        storeMarkerRef.current = null;
      }
    };
  }, []);

  const handleLocationDetect = () => {
    if (!("geolocation" in navigator)) {
      toast.error("Geolocation not supported by your browser");
      return;
    }

    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDetectingLocation(false);
        const { latitude, longitude } = position.coords;
        placeStorePin(latitude, longitude, true);
        toast.success("🧭 Store location pinned to your current GPS position!");
      },
      (error) => {
        setDetectingLocation(false);
        toast.error("Could not get current location: " + error.message);
      }
    );
  };

  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const res = await axios.post(`${url}/api/setting/update`, settings);
      if (res.data.success) {
        toast.success("Store and Payment Settings saved successfully!");
        setSettings(res.data.data);
      } else {
        toast.error(res.data.message || "Failed to update settings");
      }
    } catch (e) {
      toast.error("Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  // ── Payment Methods Handlers ──────────────────────

  const handleTogglePaymentMethod = (index) => {
    const updatedMethods = [...settings.paymentMethods];
    updatedMethods[index].active = !updatedMethods[index].active;
    setSettings({ ...settings, paymentMethods: updatedMethods });
  };

  const handleDeletePaymentMethod = (index) => {
    // Inline confirm — no window.confirm (broken in many contexts)
    if (pendingDeleteIndex === index) {
      // Confirmed: actually delete
      const updatedMethods = settings.paymentMethods.filter((_, i) => i !== index);
      setSettings({ ...settings, paymentMethods: updatedMethods });
      if (editingIndex === index) setEditingIndex(null);
      setPendingDeleteIndex(null);
    } else {
      // First click: arm the confirm
      setPendingDeleteIndex(index);
    }
  };

  const handleAddPaymentMethod = (e) => {
    e.preventDefault();
    if (!newMethod.accountName.trim() || !newMethod.accountNumber.trim()) {
      toast.error("Please enter account name and number");
      return;
    }
    const updatedMethods = [...settings.paymentMethods, { ...newMethod }];
    setSettings({ ...settings, paymentMethods: updatedMethods });
    setShowAddMethod(false);
    setNewMethod({
      provider: "Telebirr",
      accountName: "",
      accountNumber: "",
      instructions: "",
      active: true
    });
    toast.success("Payment method added! Remember to click 'Save Settings'.");
  };

  // Start editing a payment method
  const handleStartEdit = (index) => {
    setEditingIndex(index);
    setEditMethod({ ...settings.paymentMethods[index] });
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditMethod(null);
  };

  const handleSaveEdit = () => {
    if (!editMethod.accountName.trim() || !editMethod.accountNumber.trim()) {
      toast.error("Account name and number are required");
      return;
    }
    const updatedMethods = settings.paymentMethods.map((pm, i) =>
      i === editingIndex ? { ...editMethod } : pm
    );
    setSettings({ ...settings, paymentMethods: updatedMethods });
    setEditingIndex(null);
    setEditMethod(null);
    toast.success("Method updated! Click 'Save Settings' to persist.");
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Loading settings...</p>
      </div>
    );
  }

  const tiers = settings.deliveryTiers || { under5: 200, between5and10: 350, between10and15: 500, over15: 700 };

  return (
    <div className="settings-page fade-in">
      <div className="settings-header">
        <div>
          <h1 className="page-heading">Store & Payment Settings</h1>
          <p className="page-subheading">
            Configure store location, configurable delivery fee tiers, and Ethiopian bank/mobile payment accounts
          </p>
        </div>
        <button
          type="button"
          className="btn-primary btn-save"
          onClick={handleSaveSettings}
          disabled={saving}
        >
          {saving ? "Saving Changes..." : "Save All Changes"}
        </button>
      </div>

      <div className="settings-grid">
        {/* Left Column: Store Location & Delivery Tiers */}
        <div className="settings-card aura-card">
          <div className="card-header-row">
            <div className="header-icon-badge">📍</div>
            <div>
              <h2 className="card-section-title">Store Location & Delivery Fees</h2>
              <p className="card-section-desc">
                Set store coordinates for distance calculation and configure the tiered delivery fees
              </p>
            </div>
          </div>

          <form className="settings-form">
            <div className="form-group">
              <label className="form-label">Store Brand Name</label>
              <input
                type="text"
                className="form-input"
                value={settings.storeName}
                onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Store Physical Address</label>
              <input
                type="text"
                className="form-input"
                value={settings.storeAddress}
                onChange={(e) => setSettings({ ...settings, storeAddress: e.target.value })}
                placeholder="e.g. Bole Medhanialem, Addis Ababa, Ethiopia"
                required
              />
            </div>

            {/* ── Interactive Store Location Map ── */}
            <div className="store-map-wrapper">
              <div className="store-map-header">
                <div>
                  <label className="form-label" style={{ marginBottom: "2px" }}>
                    📍 Pin Store Location on Map
                  </label>
                  <p className="store-map-sub">
                    Tap anywhere on the map or drag the pin to set your store location. Delivery fees are computed from this pin.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-gps-store-detect"
                  onClick={handleLocationDetect}
                  disabled={detectingLocation}
                >
                  {detectingLocation ? "Locating..." : "📍 Use My GPS"}
                </button>
              </div>

              {/* Map container */}
              <div
                ref={mapContainerRef}
                className="store-leaflet-map-container"
                id="admin-store-map"
              />

              <div className="store-pinned-coords-badge">
                <span className="dot-live"></span>
                <span>
                  <strong>Pinned Coordinates:</strong> {settings.storeCoordinates?.lat ?? 8.9956},{" "}
                  {settings.storeCoordinates?.lng ?? 38.7891}
                </span>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Latitude</label>
                <input
                  type="number"
                  step="any"
                  className="form-input"
                  value={settings.storeCoordinates?.lat ?? ""}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val)) placeStorePin(val, settings.storeCoordinates?.lng || 0, true);
                  }}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Longitude</label>
                <input
                  type="number"
                  step="any"
                  className="form-input"
                  value={settings.storeCoordinates?.lng ?? ""}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val)) placeStorePin(settings.storeCoordinates?.lat || 0, val, true);
                  }}
                  required
                />
              </div>
            </div>

            {/* ── Delivery Fee Tiers ── */}
            <div className="tiers-section">
              <div className="tiers-header">
                <span className="tiers-icon">🚚</span>
                <div>
                  <h3 className="tiers-title">Delivery Fee Tiers</h3>
                  <p className="tiers-desc">Configurable flat-rate fees based on delivery distance</p>
                </div>
              </div>

              <div className="tiers-grid">
                <div className="tier-item">
                  <div className="tier-range-label">
                    <span className="tier-badge under">Under 5 km</span>
                  </div>
                  <div className="input-group-addon">
                    <input
                      type="number"
                      min="0"
                      className="form-input tier-input"
                      value={tiers.under5 !== undefined ? tiers.under5 : 200}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          deliveryTiers: { ...tiers, under5: Number(e.target.value) }
                        })
                      }
                    />
                    <span className="input-addon-text">{settings.currency}</span>
                  </div>
                </div>

                <div className="tier-item">
                  <div className="tier-range-label">
                    <span className="tier-badge mid-low">5 – 10 km</span>
                  </div>
                  <div className="input-group-addon">
                    <input
                      type="number"
                      min="0"
                      className="form-input tier-input"
                      value={tiers.between5and10 !== undefined ? tiers.between5and10 : 350}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          deliveryTiers: { ...tiers, between5and10: Number(e.target.value) }
                        })
                      }
                    />
                    <span className="input-addon-text">{settings.currency}</span>
                  </div>
                </div>

                <div className="tier-item">
                  <div className="tier-range-label">
                    <span className="tier-badge mid-high">10 – 15 km</span>
                  </div>
                  <div className="input-group-addon">
                    <input
                      type="number"
                      min="0"
                      className="form-input tier-input"
                      value={tiers.between10and15 !== undefined ? tiers.between10and15 : 500}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          deliveryTiers: { ...tiers, between10and15: Number(e.target.value) }
                        })
                      }
                    />
                    <span className="input-addon-text">{settings.currency}</span>
                  </div>
                </div>

                <div className="tier-item">
                  <div className="tier-range-label">
                    <span className="tier-badge far">Over 15 km</span>
                  </div>
                  <div className="input-group-addon">
                    <input
                      type="number"
                      min="0"
                      className="form-input tier-input"
                      value={tiers.over15 !== undefined ? tiers.over15 : 700}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          deliveryTiers: { ...tiers, over15: Number(e.target.value) }
                        })
                      }
                    />
                    <span className="input-addon-text">{settings.currency}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Prepayment (ቀብድ) ── */}
            <div className="tiers-section" style={{ marginTop: "0.25rem" }}>
              <div className="tiers-header">
                <span className="tiers-icon">💰</span>
                <div>
                  <h3 className="tiers-title">Prepayment (ቀብድ) per Item</h3>
                  <p className="tiers-desc">Minimum deposit required per item before order is processed</p>
                </div>
              </div>
              <div className="tier-item">
                <div className="tier-range-label">
                  <span className="tier-badge under">Per Item</span>
                </div>
                <div className="input-group-addon">
                  <input
                    type="number"
                    min="0"
                    className="form-input tier-input"
                    value={settings.prepaymentPerItem ?? 500}
                    onChange={(e) =>
                      setSettings({ ...settings, prepaymentPerItem: Number(e.target.value) })
                    }
                  />
                  <span className="input-addon-text">{settings.currency}</span>
                </div>
              </div>
            </div>

            {/* ── Urgent Order (Same-Day) Fee ── */}
            <div className="tiers-section" style={{ marginTop: "0.25rem" }}>
              <div className="tiers-header">
                <span className="tiers-icon">⚡</span>
                <div>
                  <h3 className="tiers-title">Urgent Order (Same-Day Express) Fee</h3>
                  <p className="tiers-desc">Surcharge added when customer requests urgent same-day delivery</p>
                </div>
              </div>
              <div className="tier-item">
                <div className="tier-range-label">
                  <span className="tier-badge far" style={{ background: "#fef3c7", color: "#92400e", borderColor: "#fde68a" }}>
                    ⚡ Urgent Fee
                  </span>
                </div>
                <div className="input-group-addon">
                  <input
                    type="number"
                    min="0"
                    className="form-input tier-input"
                    value={settings.urgentFee !== undefined ? settings.urgentFee : 100}
                    onChange={(e) =>
                      setSettings({ ...settings, urgentFee: Number(e.target.value) })
                    }
                  />
                  <span className="input-addon-text">{settings.currency}</span>
                </div>
              </div>
            </div>

            {/* ── Store Contact Phone for Urgent Orders ── */}
            <div className="form-group">
              <label className="form-label">📞 Store Contact Phone (For Urgent Order Calls)</label>
              <input
                type="text"
                className="form-input"
                value={settings.storePhone || ""}
                onChange={(e) => setSettings({ ...settings, storePhone: e.target.value })}
                placeholder="e.g. +251 911 223 344 or 0911223344"
                required
              />
              <span className="label-subtext">This phone number is recommended to urgent order customers to notify you immediately.</span>
            </div>

            <div className="form-group">
              <label className="form-label">Store Currency</label>
              <select
                className="form-input"
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
              >
                <option value="ETB">ETB (Ethiopian Birr)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
          </form>
        </div>

        {/* Right Column: Payment Methods Management */}
        <div className="settings-card aura-card">
          <div className="card-header-row justify-between">
            <div className="card-header-left">
              <div className="header-icon-badge">💳</div>
              <div>
                <h2 className="card-section-title">Payment Methods</h2>
                <p className="card-section-desc">
                  Bank / Mobile accounts displayed to customers — add, edit, or disable them
                </p>
              </div>
            </div>
            <button
              type="button"
              className="btn-add-method"
              onClick={() => setShowAddMethod(true)}
            >
              + Add Account
            </button>
          </div>

          {/* Payment Methods List */}
          <div className="payment-methods-list">
            {settings.paymentMethods.length === 0 ? (
              <div className="no-methods-box">
                <p>No payment accounts added yet. Add Telebirr, CBE, or other accounts.</p>
              </div>
            ) : (
              settings.paymentMethods.map((pm, idx) => (
                <div key={idx} className={`pm-item-card ${pm.active ? "active" : "inactive"}`}>
                  {editingIndex === idx ? (
                    /* ── EDIT MODE ── */
                    <div className="pm-edit-form">
                      <div className="pm-edit-header">
                        <strong className="pm-edit-title">Edit Payment Method</strong>
                        <button type="button" className="btn-cancel-edit" onClick={handleCancelEdit}>✕ Cancel</button>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Payment Channel / Bank</label>
                        <select
                          className="form-input"
                          value={editMethod.provider}
                          onChange={(e) => setEditMethod({ ...editMethod, provider: e.target.value })}
                        >
                          <option value="Telebirr">Telebirr (Ethio Telecom)</option>
                          <option value="CBE (Commercial Bank of Ethiopia)">CBE (Commercial Bank of Ethiopia)</option>
                          <option value="Bank of Abyssinia">Bank of Abyssinia</option>
                          <option value="Awash Bank">Awash Bank</option>
                          <option value="Dashen Bank">Dashen Bank</option>
                          <option value="Nib International Bank">Nib International Bank</option>
                          <option value="Cooperative Bank of Oromia">Cooperative Bank of Oromia (Coop)</option>
                          <option value="Zemen Bank">Zemen Bank</option>
                          <option value="Custom Bank / Wallet">Other Bank / Mobile Wallet</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Account Holder Name *</label>
                        <input
                          type="text"
                          className="form-input"
                          value={editMethod.accountName}
                          onChange={(e) => setEditMethod({ ...editMethod, accountName: e.target.value })}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Account Number / Phone *</label>
                        <input
                          type="text"
                          className="form-input"
                          value={editMethod.accountNumber}
                          onChange={(e) => setEditMethod({ ...editMethod, accountNumber: e.target.value })}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Instructions (Optional)</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. Use order ID as transfer remark"
                          value={editMethod.instructions}
                          onChange={(e) => setEditMethod({ ...editMethod, instructions: e.target.value })}
                        />
                      </div>

                      <div className="pm-edit-actions">
                        <button type="button" className="btn-primary btn-save-edit" onClick={handleSaveEdit}>
                          ✓ Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ── VIEW MODE ── */
                    <>
                      <div className="pm-top-row">
                        <div className="pm-provider-badge">
                          <BankLogo provider={pm.provider} size={28} />
                          <strong className="pm-provider-name">{pm.provider}</strong>
                        </div>

                        <div className="pm-actions">
                          <button
                            type="button"
                            className="btn-edit-icon"
                            onClick={() => { handleStartEdit(idx); setPendingDeleteIndex(null); }}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <label className="switch-toggle" title="Toggle active status">
                            <input
                              type="checkbox"
                              checked={pm.active}
                              onChange={() => handleTogglePaymentMethod(idx)}
                            />
                            <span className="slider round"></span>
                          </label>
                          {pendingDeleteIndex === idx ? (
                            <div className="delete-confirm-inline">
                              <span className="delete-confirm-text">Delete?</span>
                              <button
                                type="button"
                                className="btn-confirm-delete"
                                onClick={() => handleDeletePaymentMethod(idx)}
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                className="btn-cancel-delete"
                                onClick={() => setPendingDeleteIndex(null)}
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="btn-delete-icon"
                              onClick={() => handleDeletePaymentMethod(idx)}
                              title="Delete account"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="pm-details-row">
                        <div className="pm-detail-item">
                          <span className="detail-label">Account Name:</span>
                          <span className="detail-val">{pm.accountName}</span>
                        </div>
                        <div className="pm-detail-item">
                          <span className="detail-label">Account / Phone Number:</span>
                          <span className="detail-val code-font">{pm.accountNumber}</span>
                        </div>
                      </div>

                      {pm.instructions && (
                        <p className="pm-instructions-text">💡 {pm.instructions}</p>
                      )}
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Payment Method Modal */}
      {showAddMethod && ReactDOM.createPortal(
        <div className="modal-backdrop" onClick={() => setShowAddMethod(false)}>
          <div className="modal-card modal-sm fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Add Payment Method</h3>
                <p className="modal-subtitle">Add bank or mobile money account</p>
              </div>
              <button className="modal-close-btn" onClick={() => setShowAddMethod(false)}>✕</button>
            </div>

            <form onSubmit={handleAddPaymentMethod} className="modal-body">
              <div className="form-group">
                <label className="form-label">Payment Channel / Bank</label>
                <select
                  className="form-input"
                  value={newMethod.provider}
                  onChange={(e) => setNewMethod({ ...newMethod, provider: e.target.value })}
                >
                  <option value="Telebirr">Telebirr (Ethio Telecom)</option>
                  <option value="CBE (Commercial Bank of Ethiopia)">CBE (Commercial Bank of Ethiopia)</option>
                  <option value="Bank of Abyssinia">Bank of Abyssinia</option>
                  <option value="Awash Bank">Awash Bank</option>
                  <option value="Dashen Bank">Dashen Bank</option>
                  <option value="Nib International Bank">Nib International Bank</option>
                  <option value="Cooperative Bank of Oromia">Cooperative Bank of Oromia (Coop)</option>
                  <option value="Zemen Bank">Zemen Bank</option>
                  <option value="Custom Bank / Wallet">Other Bank / Mobile Wallet</option>
                </select>
              </div>

              {newMethod.provider === "Custom Bank / Wallet" && (
                <div className="form-group">
                  <label className="form-label">Custom Provider Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. PayPal / M-Pesa"
                    onChange={(e) => setNewMethod({ ...newMethod, provider: e.target.value })}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Account Holder Name <span className="label-req">*</span></label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Aura Merch PLC"
                  value={newMethod.accountName}
                  onChange={(e) => setNewMethod({ ...newMethod, accountName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Account Number / Phone <span className="label-req">*</span></label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 1000123456789 or 0911223344"
                  value={newMethod.accountNumber}
                  onChange={(e) => setNewMethod({ ...newMethod, accountNumber: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Payment Instructions (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Use order ID as transfer remark"
                  value={newMethod.instructions}
                  onChange={(e) => setNewMethod({ ...newMethod, instructions: e.target.value })}
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowAddMethod(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Account
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Settings;
