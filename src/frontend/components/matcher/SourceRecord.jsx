import LocationMap from "../LocationMap.jsx";

function SourceRecord({
  record,
  onRemove
}) {
  return (
    <article className="source-record">

      <div className="source-record-header">

        <div>
          <span className="source-label">
            {getSourceName(record.source)}
          </span>

          <h3>
            {record.name ||
              "Unnamed marina"}
          </h3>
        </div>

        <button
          className="remove-record-button"
          onClick={() =>
            onRemove(record.id)
          }
          aria-label={`Remove ${
            record.name ||
            "source record"
          }`}
        >
          ×
        </button>

      </div>

      <div className="source-record-location">
        {formatLocation(record)}
      </div>

      <LocationMap
        latitude={record.latitude}
        longitude={record.longitude}
        name={record.name}
      />

      <div className="source-record-grid">

        <DetailField
          label="ID"
          value={record.id}
        />

        <DetailField
          label="Source"
          value={getSourceName(record.source)}
        />

        <DetailField
          label="Description"
          value={record.description}
        />

        <DetailField
          label="Coordinates"
          value={formatCoordinates(
            record.latitude,
            record.longitude
          )}
        />

        <DetailField
          label="Address"
          value={formatAddress(record.address)}
        />

        <DetailField
          label="Phone"
          value={record.phone}
        />

        <DetailField
          label="Email"
          value={record.email}
        />

        <DetailField
          label="Website"
          value={record.website}
          link
        />

        <DetailField
          label="Berths"
          value={record.berths}
        />

        <DetailField
          label="Source File"
          value={record.sourceFile}
        />

      </div>

      <details className="source-record-raw">

        <summary>
          Complete Source Record
        </summary>

        <pre>
          {JSON.stringify(
            record,
            null,
            2
          )}
        </pre>

      </details>

    </article>
  );
}

function DetailField({
  label,
  value,
  link = false
}) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return (
      <div className="source-record-field">

        <label>
          {label}
        </label>

        <div className="muted">
          Not available
        </div>

      </div>
    );
  }

  return (
    <div className="source-record-field">

      <label>
        {label}
      </label>

      <div>
        {link ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
          >
            {value}
          </a>
        ) : (
          String(value)
        )}
      </div>

    </div>
  );
}

function formatLocation(record) {
  const address =
    formatAddress(record.address);

  if (address) {
    return address;
  }

  if (
    record.latitude !== null &&
    record.latitude !== undefined &&
    record.longitude !== null &&
    record.longitude !== undefined
  ) {
    return `${record.latitude}, ${record.longitude}`;
  }

  return "Location unavailable";
}

function formatCoordinates(
  latitude,
  longitude
) {
  if (
    latitude === null ||
    latitude === undefined ||
    longitude === null ||
    longitude === undefined
  ) {
    return null;
  }

  return `${latitude}, ${longitude}`;
}

function formatAddress(address) {
  if (!address) {
    return null;
  }

  if (typeof address === "string") {
    return address;
  }

  if (Array.isArray(address)) {
    return (
      address
        .filter(Boolean)
        .join(", ") ||
      null
    );
  }

  if (typeof address === "object") {
    return (
      Object.values(address)
        .filter(
          value =>
            value !== null &&
            value !== undefined &&
            value !== ""
        )
        .join(", ") ||
      null
    );
  }

  return null;
}

function getSourceName(source) {
  const names = {
    tyha: "TYHA",
    "marinas-com": "Marinas.com",
    osm: "OpenStreetMap",
    "tyha-IE": "TYHA-IE",
    "marinas-com-IE": "Marinas.com-IE",
    "osm-IE": "OpenStreetMap-IE"
  };

  return names[source] ?? source;
}

export default SourceRecord;
