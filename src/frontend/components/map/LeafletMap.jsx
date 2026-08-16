import { useEffect, useRef, useState } from "react";

const LEAFLET_VERSION = "1.9.4";
const LEAFLET_CSS_ID = "leaflet-css";
const LEAFLET_SCRIPT_ID = "leaflet-script";

let leafletPromise;

function loadLeaflet() {
  if (window.L) {
    return Promise.resolve(window.L);
  }

  if (leafletPromise) {
    return leafletPromise;
  }

  leafletPromise = new Promise((resolve, reject) => {
    if (!document.getElementById(LEAFLET_CSS_ID)) {
      const stylesheet = document.createElement("link");
      stylesheet.id = LEAFLET_CSS_ID;
      stylesheet.rel = "stylesheet";
      stylesheet.href = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`;
      stylesheet.integrity =
        "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
      stylesheet.crossOrigin = "";
      document.head.appendChild(stylesheet);
    }

    const existingScript =
      document.getElementById(LEAFLET_SCRIPT_ID);

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.L), {
        once: true
      });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Unable to load the map.")),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.id = LEAFLET_SCRIPT_ID;
    script.src = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`;
    script.integrity =
      "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
    script.crossOrigin = "";
    script.onload = () => resolve(window.L);
    script.onerror = () => reject(new Error("Unable to load the map."));
    document.head.appendChild(script);
  });

  return leafletPromise;
}

function LeafletMap({ records }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerLayerRef = useRef(null);
  const leafletRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    loadLeaflet()
      .then(L => {
        if (cancelled || !containerRef.current) {
          return;
        }

        const map = L.map(containerRef.current, {
          scrollWheelZoom: true
        }).setView([54.5, -3], 6);

        L.tileLayer(
          "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            maxZoom: 19,
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }
        ).addTo(map);

        leafletRef.current = L;
        mapRef.current = map;
        markerLayerRef.current = L.layerGroup().addTo(map);
        setReady(true);
      })
      .catch(loadError => {
        if (!cancelled) {
          setError(loadError.message);
        }
      });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerLayerRef.current = null;
      leafletRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!ready || !markerLayerRef.current || !leafletRef.current) {
      return;
    }

    const L = leafletRef.current;
    const markers = markerLayerRef.current;
    markers.clearLayers();

    const bounds = [];

    for (const record of records) {
      const latitude = Number(record.latitude);
      const longitude = Number(record.longitude);

      const marker = L.marker([latitude, longitude]);
      marker.bindPopup(createPopup(record));
      marker.addTo(markers);
      bounds.push([latitude, longitude]);
    }

    if (bounds.length === 1) {
      mapRef.current.setView(bounds[0], 13);
    } else if (bounds.length > 1) {
      mapRef.current.fitBounds(bounds, {
        padding: [36, 36],
        maxZoom: 13
      });
    }
  }, [records, ready]);

  if (error) {
    return <div className="record-map-error">{error}</div>;
  }

  return <div ref={containerRef} className="record-map-canvas" />;
}

function createPopup(record) {
  const name = escapeHtml(record.name || "Unnamed marina");
  const source = escapeHtml(getSourceName(record.source));
  const address = escapeHtml(formatAddress(record.address));

  return `
    <div class="record-map-popup">
      <strong>${name}</strong>
      <span>${source}</span>
      ${address ? `<p>${address}</p>` : ""}
    </div>
  `;
}

function formatAddress(address) {
  if (!address) {
    return "";
  }

  if (typeof address === "string") {
    return address;
  }

  if (Array.isArray(address)) {
    return address.filter(Boolean).join(", ");
  }

  if (typeof address === "object") {
    return Object.values(address)
      .filter(value => value !== null && value !== undefined && value !== "")
      .join(", ");
  }

  return String(address);
}

function getSourceName(source) {
  const names = {
    tyha: "TYHA",
    "marinas-com": "Marinas.com",
    osm: "OpenStreetMap",
    saved: "Saved record"
  };

  return names[source] ?? source;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export default LeafletMap;
