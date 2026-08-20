import { useState } from "react";

import LocationMap from "../LocationMap.jsx";

function MasterRecord({
  record,
  onChange,
  onSave,
  saving = false,
  sourceName,
  saveLabel = "Save Record",
  recordLabel = "Master Record",
  recordLabelClassName = "",
  sourceBadge,
  locationEditable = false
}) {
  return (
    <section className="master-record">

      <div className="master-record-header">

        <div>
          <div className="master-record-badges">
            <span
              className={`master-record-label ${
                recordLabelClassName
              }`}
            >
              {recordLabel}
            </span>

            {sourceBadge && (
              <span className="source-label">
                {sourceBadge}
              </span>
            )}
          </div>

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
          disabled={saving}
        >
          {saving
            ? "Saving..."
            : saveLabel}
        </button>

      </div>

      <LocationMap
        key={record.id}
        latitude={record.latitude}
        longitude={record.longitude}
        name={record.name}
        editable={locationEditable}
        onCoordinatesChange={({ latitude, longitude }) => {
          onChange("latitude", latitude);
          onChange("longitude", longitude);
        }}
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
          label="Type"
          value={record.type}
          onChange={value =>
            onChange("type", value)
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

        <AddressFields
          address={record.address}
          onChange={address =>
            onChange("address", address)
          }
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

        <FacilitiesField
          facilities={record.facilities}
          onChange={facilities =>
            onChange("facilities", facilities)
          }
        />

      </div>

      <div className="master-record-source">

        <div>
          <span className="field-label">
            Original Source
          </span>

          <strong>
            {sourceName ?? getSourceName(record.source)}
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

function FacilitiesField({
  facilities,
  onChange
}) {
  const [inputValue, setInputValue] = useState("");
  const values = normalizeFacilities(facilities);

  function addFacilities(value) {
    const additions = normalizeFacilities(value);

    if (additions.length === 0) {
      return;
    }

    const existing = new Set(
      values.map(facility => facility.toLowerCase())
    );

    const next = [
      ...values,
      ...additions.filter(facility => {
        const key = facility.toLowerCase();

        if (existing.has(key)) {
          return false;
        }

        existing.add(key);
        return true;
      })
    ];

    onChange(next);
    setInputValue("");
  }

  function removeFacility(facilityToRemove) {
    onChange(
      values.filter(
        facility => facility !== facilityToRemove
      )
    );
  }

  return (
    <div className="master-record-field facilities-field">
      <label htmlFor="facilities-input">
        Facilities
      </label>

      <div className="facility-input">
        {values.map(facility => (
          <span className="facility-badge" key={facility}>
            {facility}

            <button
              type="button"
              onClick={() => removeFacility(facility)}
              aria-label={`Remove ${facility}`}
            >
              ×
            </button>
          </span>
        ))}

        <input
          id="facilities-input"
          type="text"
          value={inputValue}
          placeholder={
            values.length === 0
              ? "Type a facility, then press Enter"
              : "Add another facility"
          }
          onChange={event =>
            setInputValue(event.target.value)
          }
          onKeyDown={event => {
            if (
              event.key === "Enter" ||
              event.key === ","
            ) {
              event.preventDefault();
              addFacilities(inputValue);
            }
          }}
          onBlur={() => addFacilities(inputValue)}
          onPaste={event => {
            const pasted =
              event.clipboardData.getData("text");

            if (/[\n,]/.test(pasted)) {
              event.preventDefault();
              addFacilities(pasted);
            }
          }}
        />
      </div>

      <span className="facility-help">
        Press Enter or comma to add a facility.
      </span>
    </div>
  );
}

function AddressFields({ address, onChange }) {
  const normalized = normalizeAddress(address);

  return (
    <div className="master-record-field address-fields">
      <label>Address</label>

      <div className="address-field-grid">
        <AddressInput label="Street" value={normalized.street}
          onChange={value => onChange({ ...normalized, street: value || null })} />
        <AddressInput label="City" value={normalized.city}
          onChange={value => onChange({ ...normalized, city: value || null })} />
        <AddressInput label="Postcode" value={normalized.postcode}
          onChange={value => onChange({ ...normalized, postcode: value || null })} />
        <AddressInput label="Country" value={normalized.country}
          onChange={value => onChange({ ...normalized, country: value || null })} />
      </div>

      <span className="facility-help">Saved as a structured address object.</span>
    </div>
  );
}

function AddressInput({ label, value, onChange }) {
  return (
    <label className="address-input">
      <span>{label}</span>
      <input type="text" value={value ?? ""}
        onChange={event => onChange(event.target.value)} />
    </label>
  );
}

function normalizeAddress(address) {
  const emptyAddress = { street: null, city: null, postcode: null, country: null };

  if (Array.isArray(address)) {
    return { ...emptyAddress, street: address.filter(Boolean).join(", ") || null };
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

  return address ? { ...emptyAddress, street: String(address) } : emptyAddress;
}

function normalizeFacilities(facilities) {
  const rawValues = Array.isArray(facilities)
    ? facilities
    : String(facilities ?? "").split(/,|\n/);

  return rawValues
    .map(facility => String(facility).trim())
    .filter(Boolean);
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
