import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import "./DeliveryRouteModal.css";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { resolveOrderCoordinates } from "../../utils/geocoding";
import { getYangoUrl, openYangoApp } from "../../utils/yango";
import axios from "axios";

// Fix Leaflet's broken default icon paths in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Create custom colored markers
const createColoredPin = (color, emoji) => {
  return L.divIcon({
    className: "custom-leaflet-marker",
    html: `
      <div style="
        background: ${color};
        width: 38px;
        height: 38px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid #ffffff;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      ">
        <span style="transform: rotate(45deg); font-size: 18px; line-height: 1;">${emoji}</span>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38]
  });
};

const DeliveryRouteModal = ({ order, isOpen, onClose, url }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [loadingRoute, setLoadingRoute] = useState(true);
  const [resolvedCoords, setResolvedCoords] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [storeCoords, setStoreCoords] = useState({ lat: 8.9956, lng: 38.7891 });
  const [storeAddress, setStoreAddress] = useState("Bole Medhanialem, Addis Ababa");

  // Fetch store coordinates from settings
  useEffect(() => {
    if (!url) return;
    axios.get(`${url}/api/setting`).then((res) => {
      if (res.data.success && res.data.data) {
        if (res.data.data.storeCoordinates?.lat && res.data.data.storeCoordinates?.lng) {
          setStoreCoords({
            lat: Number(res.data.data.storeCoordinates.lat),
            lng: Number(res.data.data.storeCoordinates.lng)
          });
        }
        if (res.data.data.storeAddress) {
          setStoreAddress(res.data.data.storeAddress);
        }
      }
    }).catch(() => {});
  }, [url]);

  // Resolve customer coordinates
  useEffect(() => {
    if (!isOpen || !order) return;
    setLoadingRoute(true);
    setResolvedCoords(null);
    setRouteInfo(null);

    resolveOrderCoordinates(order).then((coords) => {
      setResolvedCoords(coords);
      if (!coords) {
        setLoadingRoute(false);
      }
    });
  }, [isOpen, order]);

  // Initialize map and calculate driving route
  useEffect(() => {
    if (!isOpen || !resolvedCoords || !mapContainerRef.current) return;

    // Destroy existing map instance if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      const storePoint = [storeCoords.lat, storeCoords.lng];
      const customerPoint = [resolvedCoords.lat, resolvedCoords.lng];

      const map = L.map(mapContainerRef.current, {
        center: storePoint,
        zoom: 13,
        zoomControl: true
      });
      mapInstanceRef.current = map;

      // Add OpenStreetMap tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19
      }).addTo(map);

      // Store Marker (Red)
      const storeMarker = L.marker(storePoint, {
        icon: createColoredPin("#ef4444", "🏬")
      }).addTo(map);
      storeMarker.bindPopup(`<strong>🏬 Aura Store Location</strong><br/>${storeAddress}`).openPopup();

      // Customer Marker (Blue)
      const customerMarker = L.marker(customerPoint, {
        icon: createColoredPin("#2563eb", "📍")
      }).addTo(map);
      customerMarker.bindPopup(`<strong>📍 Delivery Destination</strong><br/>${order.customerName}<br/>${order.deliveryAddress || resolvedCoords.label}`);

      // Fetch driving route via OSRM
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${storeCoords.lng},${storeCoords.lat};${resolvedCoords.lng},${resolvedCoords.lat}?overview=full&geometries=geojson`;

      fetch(osrmUrl)
        .then((res) => res.json())
        .then((data) => {
          if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            const distKm = (route.distance / 1000).toFixed(1);
            const durationMin = Math.round(route.duration / 60);

            setRouteInfo({
              distanceKm: distKm,
              durationMin: durationMin,
              isRoad: true
            });

            // Convert GeoJSON coordinates [lng, lat] to Leaflet [lat, lng]
            const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);

            // Draw route line
            const polyline = L.polyline(coords, {
              color: "#2563eb",
              weight: 5,
              opacity: 0.85,
              lineCap: "round",
              lineJoin: "round"
            }).addTo(map);

            // Fit map to show both points and the route
            map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
          } else {
            fallbackStraightLine(map, storePoint, customerPoint);
          }
        })
        .catch(() => {
          fallbackStraightLine(map, storePoint, customerPoint);
        })
        .finally(() => {
          setLoadingRoute(false);
          // Force invalidateSize after animation
          setTimeout(() => map.invalidateSize(), 300);
        });
    }, 150);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, resolvedCoords, storeCoords, storeAddress, order]);

  const fallbackStraightLine = (map, storePoint, customerPoint) => {
    const line = L.polyline([storePoint, customerPoint], {
      color: "#f59e0b",
      weight: 4,
      dashArray: "8, 8",
      opacity: 0.8
    }).addTo(map);

    const R = 6371;
    const dLat = ((customerPoint[0] - storePoint[0]) * Math.PI) / 180;
    const dLon = ((customerPoint[1] - storePoint[1]) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((storePoint[0] * Math.PI) / 180) *
        Math.cos((customerPoint[0] * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distKm = (R * c).toFixed(1);

    setRouteInfo({
      distanceKm: distKm,
      durationMin: Math.round(distKm * 2.5),
      isRoad: false
    });

    map.fitBounds(line.getBounds(), { padding: [50, 50] });
    setLoadingRoute(false);
  };

  if (!isOpen || !order) return null;

  // Direct Yango App URL and Launcher
  const yangoDirectUrl = getYangoUrl({
    startCoords: storeCoords,
    endCoords: resolvedCoords,
    address: !resolvedCoords ? order.deliveryAddress : undefined,
  });

  const handleOpenYango = (e) => {
    if (e) e.preventDefault();
    openYangoApp({
      startCoords: storeCoords,
      endCoords: resolvedCoords,
      address: !resolvedCoords ? order.deliveryAddress : undefined,
    });
  };

  return ReactDOM.createPortal(
    <div className="route-modal-backdrop" onClick={onClose}>
      <div className="route-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="route-modal-header">
          <div className="route-header-left">
            <span className="route-header-icon">🚚</span>
            <div>
              <div className="route-title-row">
                <h3 className="route-modal-title">Delivery Route Navigation</h3>
                <span className="route-order-badge">#{order.orderNumber}</span>
                {order.isUrgent && <span className="route-urgent-pill">⚡ URGENT</span>}
              </div>
              <p className="route-modal-sub">
                Live delivery road route from Aura Store to customer destination
              </p>
            </div>
          </div>
          <button type="button" className="btn-close-route-modal" onClick={onClose} title="Close map">
            ✕
          </button>
        </div>

        {/* Customer & Delivery Summary Info Bar */}
        <div className="route-info-grid">
          <div className="route-info-item">
            <span className="route-info-label">Customer</span>
            <strong className="route-info-val">👤 {order.customerName}</strong>
            <a href={`tel:${order.customerPhone}`} className="route-phone-link" title="Call customer">
              📞 {order.customerPhone}
            </a>
          </div>

          <div className="route-info-item">
            <span className="route-info-label">Delivery Address / Drop-off</span>
            <strong className="route-info-val text-truncate" title={order.deliveryAddress}>
              📍 {order.deliveryAddress || "Address not provided"}
            </strong>
            <span className="route-coords-text">
              {resolvedCoords
                ? `GPS: ${resolvedCoords.lat.toFixed(5)}, ${resolvedCoords.lng.toFixed(5)}`
                : "No GPS coordinates"}
            </span>
          </div>

          <div className="route-info-item">
            <span className="route-info-label">Route Distance & Fee</span>
            <strong className="route-info-val highlight-metric">
              {routeInfo ? `${routeInfo.distanceKm} km` : order.distanceKm ? `${order.distanceKm} km` : "Calculating..."}
              {routeInfo?.durationMin && <span className="duration-tag"> (~{routeInfo.durationMin} mins drive)</span>}
            </strong>
            <span className="route-fee-sub">
              Delivery Fee: {order.deliveryFee || 0} ETB
            </span>
          </div>
        </div>

        {/* Map Container */}
        <div className="route-map-wrapper">
          <div ref={mapContainerRef} className="route-map-canvas" />

          {loadingRoute && (
            <div className="route-map-loading">
              <div className="route-spinner"></div>
              <span>Plotting fastest delivery road route...</span>
            </div>
          )}

          {!loadingRoute && !resolvedCoords && (
            <div className="route-map-error">
              <div className="error-icon">⚠️</div>
              <h4>Coordinates could not be pinpointed automatically</h4>
              <p>The address "{order.deliveryAddress}" could not be mapped to exact GPS coordinates.</p>
              <a
                href={yangoDirectUrl}
                onClick={handleOpenYango}
                className="btn-yango-search"
              >
                🔍 Open in Yango App
              </a>
            </div>
          )}

          {/* Map Legend */}
          <div className="route-map-legend">
            <div className="legend-item">
              <span className="legend-pin store-pin">🏬</span>
              <span>Aura Store (Origin)</span>
            </div>
            <div className="legend-item">
              <span className="legend-pin customer-pin">📍</span>
              <span>Customer Drop-off</span>
            </div>
            {routeInfo?.isRoad && (
              <div className="legend-item">
                <span className="legend-route-line"></span>
                <span>Driving Road Route</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="route-modal-footer">
          <div className="footer-notes">
            <span>💡 <strong>Tip for driver:</strong> Tap navigation button to launch the route directly in the Yango app.</span>
          </div>
          <div className="footer-buttons">
            <button type="button" className="btn-cancel-route" onClick={onClose}>
              Close Map
            </button>
            <a
              href={yangoDirectUrl}
              onClick={handleOpenYango}
              className="btn-yango-nav"
              title="Launch GPS turn-by-turn navigation directly in Yango app"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="3 11 22 2 13 21 11 13 3 11" />
              </svg>
              <span>Open in Yango App</span>
            </a>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DeliveryRouteModal;

