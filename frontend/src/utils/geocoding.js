// Geocoding and Addis Ababa place search utility

// Curated list of prominent Addis Ababa sub-cities, neighborhoods, and landmarks
export const ADDIS_PLACES = [
  // Bole Sub-City
  { name: "Bole Medhanialem", subcity: "Bole", lat: 8.9950, lng: 38.7885, keywords: "medhanealem church mall cinema" },
  { name: "Edna Mall / Bole Brass", subcity: "Bole", lat: 8.9968, lng: 38.7865, keywords: "cinema brass bole" },
  { name: "Bole Atlas", subcity: "Bole", lat: 9.0065, lng: 38.7770, keywords: "atlas hotel shala park" },
  { name: "Bole Rwanda", subcity: "Bole", lat: 8.9880, lng: 38.7810, keywords: "rwanda embassy japanese" },
  { name: "Bole Bulbula", subcity: "Bole", lat: 8.9630, lng: 38.7890, keywords: "bulbula 93 mariam" },
  { name: "Bole Airport / Cargo", subcity: "Bole", lat: 8.9778, lng: 38.7993, keywords: "airport terminal cargo" },
  { name: "Bole Michael", subcity: "Bole", lat: 8.9810, lng: 38.7690, keywords: "michael ring road" },
  { name: "Gerji", subcity: "Bole / Lemi Kura", lat: 9.0010, lng: 38.8150, keywords: "imperial sunshine unity" },
  { name: "Gerji Roba Bakery", subcity: "Bole", lat: 9.0040, lng: 38.8080, keywords: "roba bakery mebrat hail" },
  { name: "Gurd Shola", subcity: "Bole", lat: 9.0180, lng: 38.8180, keywords: "athletics federation supreme court" },
  { name: "Jacros", subcity: "Bole", lat: 8.9980, lng: 38.8250, keywords: "meta brewery salite mihret" },
  { name: "Bole Arabsa", subcity: "Bole", lat: 9.0050, lng: 38.8800, keywords: "condominium arabsa" },

  // Kirkos Sub-City
  { name: "Kazanchis", subcity: "Kirkos", lat: 9.0170, lng: 38.7690, keywords: "uneca intercontinental elilly hilton" },
  { name: "Meskel Square", subcity: "Kirkos", lat: 9.0100, lng: 38.7630, keywords: "stadium estifanos museum" },
  { name: "Mexico Square", subcity: "Kirkos", lat: 9.0110, lng: 38.7450, keywords: "polytechnic commerce bunna genale" },
  { name: "Sarbet", subcity: "Kirkos", lat: 8.9950, lng: 38.7400, keywords: "african union au old airport" },
  { name: "Gotera", subcity: "Kirkos", lat: 8.9880, lng: 38.7560, keywords: "interchange condominium nations" },
  { name: "Kera", subcity: "Kirkos", lat: 8.9960, lng: 38.7490, keywords: "abattoirs church slaughterhouse" },
  { name: "Olympia / Dembel", subcity: "Kirkos", lat: 9.0030, lng: 38.7680, keywords: "dembel city center bole road" },
  { name: "Beklo Bet", subcity: "Kirkos", lat: 8.9980, lng: 38.7610, keywords: "garad mall debre zeyit road" },
  { name: "Lancha", subcity: "Kirkos", lat: 8.9920, lng: 38.7590, keywords: "train global hotel" },
  { name: "Riche", subcity: "Kirkos", lat: 9.0020, lng: 38.7550, keywords: "kirkos church riche" },

  // Yeka Sub-City
  { name: "Megenagna", subcity: "Yeka", lat: 9.0200, lng: 38.8020, keywords: "lem hotel zefmesh diaspora square" },
  { name: "CMC", subcity: "Yeka", lat: 9.0280, lng: 38.8500, keywords: "michael square tsehay real estate" },
  { name: "Ayat", subcity: "Yeka", lat: 9.0270, lng: 38.8750, keywords: "ayat zone square train terminal" },
  { name: "Summit", subcity: "Yeka", lat: 9.0150, lng: 38.8780, keywords: "pepsi soft drink summit cond" },
  { name: "Shola Market", subcity: "Yeka", lat: 9.0260, lng: 38.7880, keywords: "gebeya yeka michael" },
  { name: "Kotebe", subcity: "Yeka", lat: 9.0400, lng: 38.8350, keywords: "college hana mariam" },
  { name: "Signal", subcity: "Yeka", lat: 9.0220, lng: 38.7920, keywords: "traffic light misrak polytechnic" },
  { name: "Figa", subcity: "Yeka", lat: 9.0130, lng: 38.8520, keywords: "figa sefer salite mihret" },
  { name: "Salite Mihret", subcity: "Yeka", lat: 9.0210, lng: 38.8380, keywords: "church square road" },
  { name: "Hayahulet (22 Mazoria)", subcity: "Yeka", lat: 9.0150, lng: 38.7860, keywords: "golagul 22 mazoria axum hotel" },
  { name: "Ferensay Legasion", subcity: "Yeka", lat: 9.0550, lng: 38.7850, keywords: "french embassy embassy sefer" },

  // Arada Sub-City
  { name: "Piassa (Piazza)", subcity: "Arada", lat: 9.0340, lng: 38.7520, keywords: "de gaulle square post office cinema empire" },
  { name: "Arat Kilo (4 Kilo)", subcity: "Arada", lat: 9.0320, lng: 38.7630, keywords: "victory monument parliament ministry" },
  { name: "Sidist Kilo (6 Kilo)", subcity: "Arada", lat: 9.0440, lng: 38.7620, keywords: "martyrs monument aau university yekatit 12" },
  { name: "Churchill Avenue", subcity: "Arada", lat: 9.0230, lng: 38.7500, keywords: "theatre hall tewodros square" },
  { name: "Eri Bekentu", subcity: "Arada", lat: 9.0300, lng: 38.7560, keywords: "arada market church" },

  // Lideta Sub-City
  { name: "Lideta", subcity: "Lideta", lat: 9.0080, lng: 38.7350, keywords: "church balcha hospital court" },
  { name: "Tor Hailoch", subcity: "Lideta", lat: 9.0140, lng: 38.7230, keywords: "hospital armed forces roundabout" },
  { name: "Abenet", subcity: "Lideta", lat: 9.0120, lng: 38.7390, keywords: "hotel square d'afrique" },
  { name: "Geja Sefer", subcity: "Lideta", lat: 9.0150, lng: 38.7410, keywords: "lideta market sefer" },

  // Nifas Silk-Lafto Sub-City
  { name: "Bisrate Gabriel", subcity: "Nifas Silk-Lafto", lat: 8.9880, lng: 38.7340, keywords: "gabriel church laphto mall cinema" },
  { name: "Saris", subcity: "Nifas Silk-Lafto", lat: 8.9660, lng: 38.7680, keywords: "abo church d'afrique ring road" },
  { name: "Lebu", subcity: "Nifas Silk-Lafto", lat: 8.9550, lng: 38.7150, keywords: "music floor ertu mebrat hail varnero" },
  { name: "Jomo", subcity: "Nifas Silk-Lafto", lat: 8.9480, lng: 38.7050, keywords: "condominium jomo 1 2 3 glass factory" },
  { name: "Haile Garment", subcity: "Nifas Silk-Lafto", lat: 8.9450, lng: 38.7380, keywords: "factory round about ring road" },
  { name: "German Square (Vefa)", subcity: "Nifas Silk-Lafto", lat: 8.9720, lng: 38.7350, keywords: "vefa german square mebrat" },
  { name: "Lafto", subcity: "Nifas Silk-Lafto", lat: 8.9650, lng: 38.7250, keywords: "mikael lafto sefer" },

  // Kolfe Keranio Sub-City
  { name: "Bethel", subcity: "Kolfe Keranio", lat: 8.9980, lng: 38.6980, keywords: "hospital square bethel" },
  { name: "Ayer Tena", subcity: "Kolfe Keranio", lat: 8.9850, lng: 38.6920, keywords: "roundabout square sefer" },
  { name: "Zenebework", subcity: "Kolfe Keranio", lat: 9.0100, lng: 38.7050, keywords: "hospital sefer square" },
  { name: "Wingate", subcity: "Kolfe Keranio", lat: 9.0490, lng: 38.7180, keywords: "general wingate school ring road" },
  { name: "Total / Torhailoch West", subcity: "Kolfe Keranio", lat: 9.0120, lng: 38.7180, keywords: "total station roundabout" },

  // Gulele Sub-City
  { name: "Shiromeda", subcity: "Gulele", lat: 9.0620, lng: 38.7620, keywords: "traditional clothes market entoto road" },
  { name: "Addisu Gebeya", subcity: "Gulele", lat: 9.0550, lng: 38.7380, keywords: "new market medhanialem church" },
  { name: "Semien Mazegaja", subcity: "Gulele", lat: 9.0420, lng: 38.7420, keywords: "municipality north sefer" },
  { name: "Pausa / Entoto", subcity: "Gulele", lat: 9.0750, lng: 38.7650, keywords: "entoto park observatory maryam" },

  // Addis Ketema Sub-City
  { name: "Merkato", subcity: "Addis Ketema", lat: 9.0300, lng: 38.7350, keywords: "market bombay tera military tera shema tera" },
  { name: "Autobis Tera", subcity: "Addis Ketema", lat: 9.0340, lng: 38.7380, keywords: "bus station terminal merkato" },
  { name: "Sebategna", subcity: "Addis Ketema", lat: 9.0280, lng: 38.7420, keywords: "square market sefer" },
  { name: "Amanuel", subcity: "Addis Ketema", lat: 9.0250, lng: 38.7280, keywords: "church hospital sefer" },

  // Akaki Kality Sub-City
  { name: "Kality", subcity: "Akaki Kality", lat: 8.9150, lng: 38.7650, keywords: "dry port customs terminal prison" },
  { name: "Akaki", subcity: "Akaki Kality", lat: 8.8750, lng: 38.7850, keywords: "industry bridge square" },
  { name: "Tulu Dimtu", subcity: "Akaki Kality", lat: 8.8550, lng: 38.8050, keywords: "toll expressway condominium" }
];

// Distance helper
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Find nearest landmark/neighborhood in Addis Ababa
export function getNearestAddisPlace(lat, lng) {
  if (!lat || !lng) return "Addis Ababa";
  let nearest = null;
  let minDist = Infinity;

  for (const place of ADDIS_PLACES) {
    const dist = calculateDistanceKm(lat, lng, place.lat, place.lng);
    if (dist < minDist) {
      minDist = dist;
      nearest = place;
    }
  }

  if (!nearest) return "Addis Ababa";
  if (minDist <= 0.45) {
    return `${nearest.name}, Addis Ababa`;
  }
  if (minDist <= 1.2) {
    return `Near ${nearest.name}, ${nearest.subcity}, Addis Ababa`;
  }
  return `Near ${nearest.name} (${nearest.subcity}), Addis Ababa`;
}

// Clean address from Nominatim reverse geocode response
function extractCleanAddress(data) {
  if (!data) return "";
  const addr = data.address || {};
  const placeName =
    data.name ||
    addr.amenity ||
    addr.building ||
    addr.shop ||
    addr.tourism ||
    addr.office ||
    addr.leisure;
  const road = addr.road || addr.pedestrian || addr.street;
  const suburb = addr.suburb || addr.neighbourhood || addr.city_district || addr.quarter;
  const city = addr.city || addr.town || "Addis Ababa";

  const parts = [];
  if (placeName && !parts.includes(placeName)) parts.push(placeName);
  if (road && !parts.includes(road) && road !== placeName) parts.push(road);
  if (suburb && !parts.includes(suburb) && suburb !== placeName && suburb !== road) parts.push(suburb);
  if (city && !parts.includes(city)) parts.push(city);

  if (parts.length > 0) {
    return parts.join(", ");
  }

  if (data.display_name) {
    // Take top 3 components of display_name
    return data.display_name.split(",").slice(0, 3).map((s) => s.trim()).join(", ");
  }

  return "";
}

// Reverse geocode coordinates to place name
export async function reverseGeocodeCoordinates(lat, lng) {
  const fallback = getNearestAddisPlace(lat, lng);
  if (!lat || !lng) return fallback;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=18&addressdetails=1`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json"
      }
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const clean = extractCleanAddress(data);
      if (clean && clean.length > 3) {
        return clean;
      }
    }
  } catch (err) {
    // Network offline or blocked; graceful fallback to nearest Addis place
  }

  return fallback;
}

// Search places in Addis Ababa (local curated search + live Nominatim OSM search)
export async function searchAddisPlaces(query) {
  const q = (query || "").trim().toLowerCase();
  if (!q) return [];

  // 1. Instant local matching
  const localMatches = ADDIS_PLACES.filter((p) => {
    return (
      p.name.toLowerCase().includes(q) ||
      p.subcity.toLowerCase().includes(q) ||
      (p.keywords && p.keywords.toLowerCase().includes(q))
    );
  }).map((p) => ({
    title: p.name,
    subtitle: `${p.subcity}, Addis Ababa`,
    lat: p.lat,
    lng: p.lng,
    source: "local"
  }));

  // 2. If short query or offline, return local matches right away
  if (q.length < 3) {
    return localMatches.slice(0, 6);
  }

  // 3. Try live Nominatim search for specific buildings, streets, hotels, etc.
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    // Limit search to Ethiopia / Addis Ababa bounding area
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      q + " Addis Ababa"
    )}&format=json&limit=5&addressdetails=1&countrycodes=et`;

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json"
      }
    });
    clearTimeout(timeout);

    if (res.ok) {
      const osmData = await res.json();
      const liveMatches = (osmData || [])
        .map((item) => {
          const lat = parseFloat(item.lat);
          const lng = parseFloat(item.lon);
          // Check if roughly within Addis Ababa bounding box
          if (lat < 8.75 || lat > 9.20 || lng < 38.55 || lng > 39.05) {
            return null;
          }
          const title = item.name || item.display_name.split(",")[0].trim();
          const subtitleParts = item.display_name.split(",").slice(1, 3).map((s) => s.trim());
          return {
            title,
            subtitle: subtitleParts.join(", ") || "Addis Ababa",
            lat,
            lng,
            source: "osm"
          };
        })
        .filter(Boolean);

      // Merge results avoiding duplicate titles
      const combined = [...localMatches];
      for (const live of liveMatches) {
        if (!combined.some((c) => c.title.toLowerCase() === live.title.toLowerCase() || calculateDistanceKm(c.lat, c.lng, live.lat, live.lng) < 0.25)) {
          combined.push(live);
        }
      }
      return combined.slice(0, 8);
    }
  } catch (err) {
    // If online search fails, return local matches
  }

  return localMatches.slice(0, 8);
}

