function LocationMap({
  latitude,
  longitude,
  name = "record"
}) {
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

        <a
          href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=15/${lat}/${lon}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open larger map
        </a>
      </div>

      <iframe
        title={`Map location for ${name}`}
        src={mapUrl.toString()}
        loading="lazy"
      />
    </section>
  );
}

export default LocationMap;
