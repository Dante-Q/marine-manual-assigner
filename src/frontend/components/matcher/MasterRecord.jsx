import LocationMap from "../LocationMap.jsx";

function MasterRecord({
  record,
  onChange,
  onSave
}) {
  return (
    <section className="master-record">

      <div className="master-record-header">

        <div>
          <span className="master-record-label">
            Master Record
          </span>

          <h2>
            {record.name ||
              "Unnamed marina"}
          </h2>

          <p>
            Edit this record before saving it
            as your own marina record.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={onSave}
        >
          Save Record
        </button>

      </div>

      <LocationMap
        latitude={record.latitude}
        longitude={record.longitude}
        name={record.name}
      />

      <div className="master-record-form">

        <EditableField
          label="Name"
          value={record.name}
          onChange={value =>
            onChange("name", value)
          }
        />

        <EditableField
          label="Description"
          value={record.description}
          onChange={value =>
            onChange("description", value)
          }
          textarea
        />

        <EditableField
          label="Latitude"
          value={record.latitude}
          onChange={value =>
            onChange("latitude", value)
          }
        />

        <EditableField
          label="Longitude"
          value={record.longitude}
          onChange={value =>
            onChange("longitude", value)
          }
        />

        <EditableField
          label="Address"
          value={formatAddress(record.address)}
          onChange={value =>
            onChange("address", value)
          }
          textarea
        />

        <EditableField
          label="Phone"
          value={record.phone}
          onChange={value =>
            onChange("phone", value)
          }
        />

        <EditableField
          label="Email"
          value={record.email}
          onChange={value =>
            onChange("email", value)
          }
        />

        <EditableField
          label="Website"
          value={record.website}
          onChange={value =>
            onChange("website", value)
          }
        />

        <EditableField
          label="Berths"
          value={record.berths}
          onChange={value =>
            onChange("berths", value)
          }
        />

      </div>

      <div className="master-record-source">

        <div>
          <span className="field-label">
            Original Source
          </span>

          <strong>
            {getSourceName(record.source)}
          </strong>
        </div>

        <div>
          <span className="field-label">
            Source Record ID
          </span>

          <strong>
            {record.id}
          </strong>
        </div>

        <div>
          <span className="field-label">
            Source File
          </span>

          <strong>
            {record.sourceFile ||
              "Not available"}
          </strong>
        </div>

      </div>

    </section>
  );
}

function EditableField({
  label,
  value,
  onChange,
  textarea = false
}) {
  const displayValue =
    value === null ||
    value === undefined
      ? ""
      : String(value);

  return (
    <div className="master-record-field">

      <label>
        {label}
      </label>

      {textarea ? (
        <textarea
          value={displayValue}
          onChange={event =>
            onChange(event.target.value)
          }
          rows={4}
        />
      ) : (
        <input
          type="text"
          value={displayValue}
          onChange={event =>
            onChange(event.target.value)
          }
        />
      )}

    </div>
  );
}

function formatAddress(address) {
  if (!address) {
    return "";
  }

  if (typeof address === "string") {
    return address;
  }

  if (Array.isArray(address)) {
    return address
      .filter(Boolean)
      .join(", ");
  }

  if (typeof address === "object") {
    return Object.values(address)
      .filter(
        value =>
          value !== null &&
          value !== undefined &&
          value !== ""
      )
      .join(", ");
  }

  return String(address);
}

function getSourceName(source) {
  const names = {
    tyha: "TYHA",
    "marinas-com": "Marinas.com",
    osm: "OpenStreetMap"
  };

  return names[source] ?? source;
}

export default MasterRecord;
