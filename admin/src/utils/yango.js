// Yango ride request & route deep linking utility

// Default store location: Bole Medhanialem, Addis Ababa
export const DEFAULT_STORE_COORDS = { lat: 8.9956, lng: 38.7891 };

/**
 * Detect client platform
 */
export function getClientPlatform() {
  const ua = (typeof navigator !== "undefined" && navigator.userAgent) || "";
  const isAndroid = /android/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  return {
    isAndroid,
    isIOS,
    isMobile: isAndroid || isIOS,
  };
}

/**
 * Generate official Yango ride booking smart link
 * Pre-populates:
 *   - Start Point (From / Pickup): Aura Store location
 *   - End Point (Destination / Drop-off): Customer delivery GPS / Address
 */
export function getYangoUrl({ startCoords, endCoords, address } = {}) {
  const start =
    startCoords &&
    typeof startCoords.lat === "number" &&
    typeof startCoords.lng === "number" &&
    (startCoords.lat !== 0 || startCoords.lng !== 0)
      ? startCoords
      : DEFAULT_STORE_COORDS;

  const startLat = Number(start.lat).toFixed(6);
  const startLon = Number(start.lng).toFixed(6);

  // If destination coordinates are available, generate full ride request link
  if (
    endCoords &&
    typeof endCoords.lat === "number" &&
    typeof endCoords.lng === "number" &&
    (endCoords.lat !== 0 || endCoords.lng !== 0)
  ) {
    const endLat = Number(endCoords.lat).toFixed(6);
    const endLon = Number(endCoords.lng).toFixed(6);

    // Web order fallback with pickup and dropoff prefilled (gfrom=lon,lat & gto=lon,lat)
    const webFallback = `https://yango.com/en_int/order/?gfrom=${startLon}%2C${startLat}&gto=${endLon}%2C${endLat}&ref=aura`;
    const encodedFallback = encodeURIComponent(webFallback);

    // Official Yango Smart Link with valid Adjust campaign token (vokme8e_nd9s9z9)
    // Seamlessly opens the Yango app on Android & iOS with pickup and destination pre-populated
    return `https://yango.go.link/route?start-lat=${startLat}&start-lon=${startLon}&end-lat=${endLat}&end-lon=${endLon}&adj_adgroup=widget&ref=aura&adj_t=vokme8e_nd9s9z9&lang=en&adj_deeplink_js=1&utm_source=widget&adj_fallback=${encodedFallback}`;
  }

  // If only text address is available
  if (address) {
    const encodedAddr = encodeURIComponent(address);
    const webFallback = `https://yango.com/en_int/order/?gfrom=${startLon}%2C${startLat}&text=${encodedAddr}&ref=aura`;
    const encodedFallback = encodeURIComponent(webFallback);

    return `https://yango.go.link/route?start-lat=${startLat}&start-lon=${startLon}&text=${encodedAddr}&adj_adgroup=widget&ref=aura&adj_t=vokme8e_nd9s9z9&lang=en&adj_deeplink_js=1&utm_source=widget&adj_fallback=${encodedFallback}`;
  }

  // Default fallback: pickup at Aura store
  return `https://yango.com/en_int/order/?gfrom=${startLon}%2C${startLat}&ref=aura`;
}

/**
 * Open Yango with From (Aura Store) and To (Customer Destination) pre-filled
 */
export function openYangoApp({ startCoords, endCoords, address } = {}) {
  const { isMobile } = getClientPlatform();
  const url = getYangoUrl({ startCoords, endCoords, address });

  if (isMobile) {
    // Top-level navigation triggers Android App Links / iOS Universal Links into the native Yango app
    window.location.href = url;
  } else {
    // Desktop: open web ride ordering in a new tab
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
