import { useMemo, useState } from "react";

function Matcher({
  records,
  matchedRecords,
  setMatchedRecords
}) {
  const [addingRecord, setAddingRecord] = useState(false);
  const [search, setSearch] = useState("");

  const searchResults = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return [];
    }

    return records.filter(record => {
      const alreadyAdded = matchedRecords.some(
        matched => matched.id === record.id
      );

      if (alreadyAdded) {
        return false;
      }

      const name =
        record.name?.toLowerCase() ?? "";

      const address =
        JSON.stringify(
          record.address
        ).toLowerCase();

      const source =
        record.source?.toLowerCase() ?? "";

      return (
        name.includes(query) ||
        address.includes(query) ||
        source.includes(query)
      );
    });
  }, [
    records,
    matchedRecords,
    search
  ]);

  function openAddRecord() {
    setAddingRecord(true);
    setSearch("");
  }

  function closeAddRecord() {
    setAddingRecord(false);
    setSearch("");
  }

  function addRecord(record) {
    setMatchedRecords(current => {
      const alreadyAdded = current.some(
        existing => existing.id === record.id
      );

      if (alreadyAdded) {
        return current;
      }

      return [
        ...current,
        record
      ];
    });

    setSearch("");
  }

  function removeRecord(recordId) {
    setMatchedRecords(current =>
      current.filter(
        record => record.id !== recordId
      )
    );
  }

  return (
    <div className="matcher-page">

      {!addingRecord && (
        <div className="matcher-header">

          <div>
            <h2>
              Manual Matcher
            </h2>

            <p>
              Build and manage marina record
              matches across data sources.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={openAddRecord}
          >
            Add New Record
          </button>

        </div>
      )}

      {addingRecord ? (
        <AddRecordSearch
          search={search}
          setSearch={setSearch}
          results={searchResults}
          onAdd={addRecord}
          onClose={closeAddRecord}
        />
      ) : (
        <MatchedRecords
          records={matchedRecords}
          onRemove={removeRecord}
          onAdd={openAddRecord}
        />
      )}

    </div>
  );
}

function AddRecordSearch({
  search,
  setSearch,
  results,
  onAdd,
  onClose
}) {
  return (
    <div className="add-record-panel">

      <div className="add-record-header">

        <div>
          <h3>
            Add Record
          </h3>

          <p>
            Search the source records and add
            one to this match.
          </p>
        </div>

        <button
          className="close-button"
          onClick={onClose}
          aria-label="Close add record"
        >
          ×
        </button>

      </div>

      <input
        className="matcher-search"
        type="search"
        placeholder="Search by marina name, address or source..."
        value={search}
        onChange={event =>
          setSearch(event.target.value)
        }
        autoFocus
      />

      <div className="matcher-search-results">

        {!search.trim() ? (
          <div className="matcher-search-empty">
            Start typing to search records.
          </div>
        ) : results.length === 0 ? (
          <div className="matcher-search-empty">
            No matching records found.
          </div>
        ) : (
          results.map(record => (
            <button
              key={record.id}
              className="matcher-search-result"
              onClick={() => onAdd(record)}
            >

              <div className="matcher-result-main">

                <strong>
                  {record.name ||
                    "Unnamed marina"}
                </strong>

                <span>
                  {formatLocation(record)}
                </span>

              </div>

              <span className="matcher-result-source">
                {getSourceName(record.source)}
              </span>

            </button>
          ))
        )}

      </div>

    </div>
  );
}

function MatchedRecords({
  records,
  onRemove,
  onAdd
}) {
  if (records.length === 0) {
    return (
      <div className="matcher-empty">

        <h2>
          No records added
        </h2>

        <p>
          Add records from the available data
          sources to begin building a match.
        </p>

        <button
          className="primary-button"
          onClick={onAdd}
        >
          Add New Record
        </button>

      </div>
    );
  }

  return (
    <>
      <div className="matcher-records">

        {records.map(record => (
          <MatchedRecord
            key={record.id}
            record={record}
            onRemove={onRemove}
          />
        ))}

      </div>

      <div className="matcher-add-another">
        <button
          className="primary-button"
          onClick={onAdd}
        >
          Add Another Record
        </button>
      </div>
    </>
  );
}

function MatchedRecord({
  record,
  onRemove
}) {
  return (
    <div className="matcher-record">

      <div className="matcher-record-header">

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
            "record"
          }`}
        >
          ×
        </button>

      </div>

      <div className="matcher-record-location">
        {formatLocation(record)}
      </div>

      <div className="matcher-detail-grid">

        <MatcherDetailField
          label="ID"
          value={record.id}
        />

        <MatcherDetailField
          label="Source"
          value={record.source}
        />

        <MatcherDetailField
          label="Source File"
          value={record.sourceFile}
        />

        <MatcherDetailField
          label="Description"
          value={record.description}
        />

        <MatcherDetailField
          label="Location"
          value={formatCoordinates(
            record.latitude,
            record.longitude
          )}
        />

        <MatcherDetailField
          label="Address"
          value={formatAddress(
            record.address
          )}
        />

        <MatcherDetailField
          label="Phone"
          value={record.phone}
        />

        <MatcherDetailField
          label="Email"
          value={record.email}
        />

        <MatcherDetailField
          label="Website"
          value={record.website}
        />

        <MatcherDetailField
          label="Berths"
          value={record.berths}
        />

        <MatcherDetailField
          label="Facilities"
          value={formatJsonValue(
            record.facilities
          )}
        />

        <MatcherDetailField
          label="Images"
          value={formatJsonValue(
            record.images
          )}
        />

        <MatcherDetailField
          label="Source URL"
          value={record.sourceUrl}
          link
        />

      </div>

      <div className="matcher-raw-section">

        <div className="matcher-raw-header">

          <h4>
            Complete Record
          </h4>

          <span>
            Normalized record including
            original source data
          </span>

        </div>

        <pre>
          {JSON.stringify(
            record,
            null,
            2
          )}
        </pre>

      </div>

    </div>
  );
}

function MatcherDetailField({
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
      <div className="matcher-detail-field">

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
    <div className="matcher-detail-field">

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

function formatJsonValue(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  if (
    Array.isArray(value) &&
    value.length === 0
  ) {
    return null;
  }

  if (
    typeof value === "object"
  ) {
    return JSON.stringify(
      value,
      null,
      2
    );
  }

  return String(value);
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
    osm: "OpenStreetMap"
  };

  return names[source] ?? source;
}

export default Matcher;