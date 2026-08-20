import LocationMap from "../LocationMap.jsx";

function SourceRecord({ record, onRemove }) {
  return (
    <article className="master-record source-record">
      <div className="master-record-header">
        <div>
          <div className="master-record-badges">
            <span className="master-record-label">Source Record</span>
            <span className="source-label">{getSourceName(record.source)}</span>
          </div>
          <h2>{record.name || "Unnamed marina"}</h2>
          <p>Read-only data from the original source record.</p>
        </div>

        <button
          className="secondary-button"
          onClick={() => onRemove(record.id)}
        >
          Remove Source
        </button>
      </div>

      <LocationMap
        latitude={record.latitude}
        longitude={record.longitude}
        name={record.name}
      />

      <div className="master-record-form source-record-form">
        <ReadOnlyField label="Name" value={record.name} />
        <ReadOnlyField label="Type" value={record.type} />
        <ReadOnlyField label="Description" value={record.description} textarea />
        <ReadOnlyField label="Latitude" value={record.latitude} />
        <ReadOnlyField label="Longitude" value={record.longitude} />
        <ReadOnlyAddress address={record.address} />
        <ReadOnlyField label="Phone" value={record.phone} />
        <ReadOnlyField label="Email" value={record.email} />
        <ReadOnlyField label="Website" value={record.website} />
        <ReadOnlyField label="Berths" value={record.berths} />
        <ReadOnlyServices facilities={record.facilities} />
      </div>

      <div className="master-record-source">
        <div>
          <span className="field-label">Original Source</span>
          <strong>{getSourceName(record.source)}</strong>
        </div>
        <div>
          <span className="field-label">Source Record ID</span>
          <strong>{record.id}</strong>
        </div>
        <div>
          <span className="field-label">Source File</span>
          <strong>{record.sourceFile || "Not available"}</strong>
        </div>
      </div>

      <details className="source-record-raw">
        <summary>Complete Source Record</summary>
        <pre>{JSON.stringify(record, null, 2)}</pre>
      </details>
    </article>
  );
}

function ReadOnlyField({ label, value, textarea = false }) {
  const displayValue = value === null || value === undefined ? "" : String(value);

  return (
    <div className="master-record-field">
      <label>{label}</label>
      {textarea ? (
        <textarea value={displayValue} rows={4} readOnly />
      ) : (
        <input type="text" value={displayValue} readOnly />
      )}
    </div>
  );
}

function ReadOnlyAddress({ address }) {
  const normalized = normalizeAddress(address);

  return (
    <div className="master-record-field address-fields">
      <label>Address</label>
      <div className="address-field-grid">
        <ReadOnlyAddressInput label="Street" value={normalized.street} />
        <ReadOnlyAddressInput label="City" value={normalized.city} />
        <ReadOnlyAddressInput label="Postcode" value={normalized.postcode} />
        <ReadOnlyAddressInput label="Country" value={normalized.country} />
      </div>
      <span className="facility-help">Original structured address.</span>
    </div>
  );
}

function ReadOnlyAddressInput({ label, value }) {
  return (
    <label className="address-input">
      <span>{label}</span>
      <input type="text" value={value ?? ""} readOnly />
    </label>
  );
}

function ReadOnlyServices({ facilities }) {
  const values = Array.isArray(facilities) ? facilities.filter(Boolean) : [];

  return (
    <div className="master-record-field facilities-field">
      <label>Services</label>
      <div className="facility-input source-facilities">
        {values.length > 0 ? values.map(facility => (
          <span className="facility-badge" key={facility}>{facility}</span>
        )) : (
          <span className="source-empty-value">No services listed</span>
        )}
      </div>
      <span className="facility-help">Services from the original source.</span>
    </div>
  );
}

function normalizeAddress(address) {
  const emptyAddress = {
    street: null,
    city: null,
    postcode: null,
    country: null
  };

  if (Array.isArray(address)) {
    return {
      ...emptyAddress,
      street: address.filter(Boolean).join(", ") || null
    };
  }

  if (typeof address === "object" && address) {
    return {
      ...emptyAddress,
      street: address.street ?? null,
      city: address.city ?? null,
      postcode: address.postcode ?? null,
      country: address.country ?? null
    };
  }

  return address
    ? { ...emptyAddress, street: String(address) }
    : emptyAddress;
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
