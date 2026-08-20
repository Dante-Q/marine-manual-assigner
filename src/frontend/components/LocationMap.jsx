import { useState } from "react";

import LeafletMap from "./map/LeafletMap.jsx";

function LocationMap({
  latitude,
  longitude,
  name = "record",
  editable = false,
  onCoordinatesChange
}) {
  const [movePinEnabled, setMovePinEnabled] = useState(false);
  const [editorStart, setEditorStart] = useState(null);
  const lat = Number(latitude);
  const lon = Number(longitude);

  if (
    latitude === null ||
    latitude === undefined ||
    latitude === "" ||
    longitude === null ||
    longitude === undefined ||
    longitude === "" ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180
  ) {
    return (
      <section className="location-map location-map-unavailable">
        <h3>Location map</h3>
        <p>Coordinates are not available for this record.</p>
      </section>
    );
  }

  const latitudePadding = 0.018;
  const longitudePadding = 0.03;
  const bbox = [
    lon - longitudePadding,
    lat - latitudePadding,
    lon + longitudePadding,
    lat + latitudePadding
  ].join(",");

  const mapUrl = new URL(
    "https://www.openstreetmap.org/export/embed.html"
  );

  mapUrl.searchParams.set("bbox", bbox);
  mapUrl.searchParams.set("layer", "mapnik");
  mapUrl.searchParams.set("marker", `${lat},${lon}`);

  return (
    <section className="location-map">
      <div className="location-map-header">
        <h3>Location map</h3>

        <div className="location-map-actions">
          {editable && (
            <label className="location-map-move-toggle">
              <input
                type="checkbox"
                checked={movePinEnabled}
                onChange={event => {
                  const enabled = event.target.checked;

                  if (enabled) {
                    setEditorStart({ latitude: lat, longitude: lon });
                  }

                  setMovePinEnabled(enabled);
                }}
              />
              Move pin
            </label>
          )}

          <a
            href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=15/${lat}/${lon}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open larger map
          </a>
        </div>
      </div>

      {movePinEnabled ? (
        <div className="location-map-editor">
          <LeafletMap
            records={[{
              id: "location-editor-pin",
              name,
              latitude: lat,
              longitude: lon,
              source: "manual"
            }]}
            initialView={{
              latitude: editorStart?.latitude ?? lat,
              longitude: editorStart?.longitude ?? lon,
              zoom: 15
            }}
            focusedRecord={{ latitude: lat, longitude: lon }}
            focusZoom
            draggableRecordId="location-editor-pin"
            onRecordMove={onCoordinatesChange}
          />
          <p>Drag the blue pin to update the coordinates below.</p>
        </div>
      ) : (
        <iframe
          title={`Map location for ${name}`}
          src={mapUrl.toString()}
          loading="lazy"
        />
      )}
    </section>
  );
}

export default LocationMap;
