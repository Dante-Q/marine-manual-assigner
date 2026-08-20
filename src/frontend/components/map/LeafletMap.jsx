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

function LeafletMap({
  records,
  onSelectRecord,
  onAddSourceRecord,
  onEditRawRecord,
  onDeleteRawRecord,
  onToggleRawRecordHidden,
  masterRecordId,
  sourceRecordIds = [],
  initialView,
  onViewChange,
  focusedRecord,
  focusToken,
  focusZoom = false,
  draggableRecordId,
  onRecordMove,
  scrollWheelZoom = true,
  clickToEnableScrollZoom = false
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerLayerRef = useRef(null);
  const leafletRef = useRef(null);
  const hasInitializedViewRef = useRef(false);
  const handlersRef = useRef({});
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  handlersRef.current = {
    onSelectRecord,
    onAddSourceRecord,
    onEditRawRecord,
    onDeleteRawRecord,
    onToggleRawRecordHidden,
    onRecordMove
  };

  const sourceRecordIdsKey = sourceRecordIds.join("\u0000");
  const canAddSourceRecords = Boolean(onAddSourceRecord);

  useEffect(() => {
    let cancelled = false;

    loadLeaflet()
      .then(L => {
        if (cancelled || !containerRef.current) {
          return;
        }

        const map = L.map(containerRef.current, {
          scrollWheelZoom: clickToEnableScrollZoom ? false : scrollWheelZoom
        });

        if (clickToEnableScrollZoom) {
          const container = map.getContainer();

          map.on("click", () => {
            map.scrollWheelZoom.enable();
            container.classList.add("scroll-zoom-active");
          });

          container.addEventListener("mouseleave", () => {
            map.scrollWheelZoom.disable();
            container.classList.remove("scroll-zoom-active");
          });
        }

        if (initialView) {
          map.setView(
            [initialView.latitude, initialView.longitude],
            initialView.zoom
          );
          hasInitializedViewRef.current = true;
        } else {
          map.setView([54.5, -3], 6);
        }

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

        // Maps mounted by a mode toggle can be measured before the browser has
        // completed the layout. Re-measure before centering the editable pin.
        window.requestAnimationFrame(() => {
          if (!cancelled) {
            map.invalidateSize();
            if (initialView) {
              map.setView(
                [initialView.latitude, initialView.longitude],
                initialView.zoom
              );
            }
          }
        });

        map.on("moveend", () => {
          const center = map.getCenter();

          onViewChange?.({
            latitude: center.lat,
            longitude: center.lng,
            zoom: map.getZoom()
          });
        });
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

      const marker = L.marker(
        [latitude, longitude],
        {
          draggable: record.id === draggableRecordId,
          icon: createMarkerIcon(
            L,
            record.mapSource ?? record.source
          )
        }
      );
      if (record.id === draggableRecordId) {
        marker.on("dragend", event => {
          const position = event.target.getLatLng();
          handlersRef.current.onRecordMove?.({
            latitude: Number(position.lat.toFixed(6)),
            longitude: Number(position.lng.toFixed(6))
          });
        });
      }
      const canAddAsSource =
        canAddSourceRecords &&
        record.mapSource !== "saved" &&
        record.id !== masterRecordId &&
        !sourceRecordIds.includes(record.id);

      const isRawRecord = record.mapSource !== "saved";

      if (record.id !== draggableRecordId) {
        marker.bindPopup(
          createPopup(record, canAddAsSource, isRawRecord)
        );
      }
      marker.on("popupopen", event => {
        const editButton =
          event.popup
            .getElement()
            ?.querySelector(".record-map-edit-button");

        editButton?.addEventListener("click", clickEvent => {
          clickEvent.preventDefault();
          clickEvent.stopPropagation();
          handlersRef.current.onSelectRecord?.(record);
        });

        const addSourceButton =
          event.popup
            .getElement()
            ?.querySelector(".record-map-add-source-button");

        addSourceButton?.addEventListener("click", clickEvent => {
          clickEvent.preventDefault();
          clickEvent.stopPropagation();
          handlersRef.current.onAddSourceRecord?.(record);
        });

        const editRawButton =
          event.popup.getElement()?.querySelector(
            ".record-map-edit-raw-button"
          );

        editRawButton?.addEventListener("click", clickEvent => {
          clickEvent.preventDefault();
          clickEvent.stopPropagation();
          handlersRef.current.onEditRawRecord?.(record);
        });

        const deleteRawButton =
          event.popup.getElement()?.querySelector(
            ".record-map-delete-raw-button"
          );

        deleteRawButton?.addEventListener("click", clickEvent => {
          clickEvent.preventDefault();
          clickEvent.stopPropagation();
          handlersRef.current.onDeleteRawRecord?.(record);
        });

        const toggleHiddenButton =
          event.popup.getElement()?.querySelector(
            ".record-map-toggle-hidden-button"
          );

        toggleHiddenButton?.addEventListener("click", clickEvent => {
          clickEvent.preventDefault();
          clickEvent.stopPropagation();
          handlersRef.current.onToggleRawRecordHidden?.(record);
        });
      });
      marker.addTo(markers);
      bounds.push([latitude, longitude]);
    }

    if (!hasInitializedViewRef.current) {
      if (bounds.length === 1) {
        mapRef.current.setView(bounds[0], 13);
      } else if (bounds.length > 1) {
        mapRef.current.fitBounds(bounds, {
          padding: [36, 36],
          maxZoom: 13
        });
      }

      hasInitializedViewRef.current = true;
    }
  }, [
    records,
    ready,
    canAddSourceRecords,
    masterRecordId,
    sourceRecordIdsKey,
    draggableRecordId
  ]);

  useEffect(() => {
    if (!ready || !mapRef.current || !focusedRecord) return;

    const latitude = Number(focusedRecord.latitude);
    const longitude = Number(focusedRecord.longitude);

    if (
      focusedRecord.latitude !== null &&
      focusedRecord.latitude !== undefined &&
      focusedRecord.latitude !== "" &&
      focusedRecord.longitude !== null &&
      focusedRecord.longitude !== undefined &&
      focusedRecord.longitude !== "" &&
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    ) {
      if (focusZoom) {
        mapRef.current.setView([latitude, longitude], 14);
      } else {
        mapRef.current.panTo([latitude, longitude]);
      }
    }
  }, [
    ready,
    focusedRecord?.latitude,
    focusedRecord?.longitude,
    focusToken,
    focusZoom
  ]);

  if (error) {
    return <div className="record-map-error">{error}</div>;
  }

  return <div ref={containerRef} className="record-map-canvas" />;
}

function createMarkerIcon(L, source) {
  const sourceClass = {
    tyha: "tyha",
    "marinas-com": "marinas-com",
    osm: "osm",
    "tyha-IE": "tyha-IE",
    "marinas-com-IE": "marinas-com-IE",
    "osm-IE": "osm-IE",
    saved: "saved",
    manual: "manual"
  }[source] ?? "default";

  return L.divIcon({
    className: "record-map-marker",
    html: `<span class="record-map-pin ${sourceClass}"></span>`,
    iconSize: [24, 30],
    iconAnchor: [12, 30],
    popupAnchor: [0, -30]
  });
}

function createPopup(record, canAddAsSource, isRawRecord) {
  const name = escapeHtml(record.name || "Unnamed marina");
  const source = escapeHtml(
    getSourceName(record.mapSource ?? record.source)
  );
  const address = escapeHtml(formatAddress(record.address));

  return `
    <div class="record-map-popup">
      <strong>${name}</strong>
      <span>${source}</span>
      ${address ? `<p>${address}</p>` : ""}
      <div class="record-map-popup-actions">
        <button type="button" class="record-map-edit-button">
          ${isRawRecord ? "Add master record" : "Edit saved record"}
        </button>
        ${canAddAsSource ? `
          <button type="button" class="record-map-add-source-button">
            Add source record
          </button>
        ` : ""}
      </div>
      ${isRawRecord ? `
        <div class="record-map-popup-actions raw-actions">
          <button type="button" class="record-map-edit-raw-button">Edit raw data</button>
          <button type="button" class="record-map-delete-raw-button">Delete raw data</button>
          <button type="button" class="record-map-toggle-hidden-button">
            ${record.isHiddenPin ? "Unhide raw pin" : "Hide raw pin"}
          </button>
        </div>
      ` : ""}
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
    "tyha-IE": "TYHA-IE",
    "marinas-com-IE": "Marinas.com-IE",
    "osm-IE": "OpenStreetMap-IE",
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
