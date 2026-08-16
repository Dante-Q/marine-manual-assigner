import { useMemo, useState } from "react";

function Matcher({ records }) {
  const [matchedRecords, setMatchedRecords] = useState([]);
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
    setMatchedRecords(current => [
      ...current,
      record
    ]);

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

        {!addingRecord && (
          <button
            className="primary-button"
            onClick={openAddRecord}
          >
            Add New Record
          </button>
        )}

      </div>

      <div className="matcher-content">

        {matchedRecords.length > 0 && (
          <MatchedRecords
            records={matchedRecords}
            onRemove={removeRecord}
          />
        )}

        {matchedRecords.length === 0 &&
          !addingRecord && (
            <div className="matcher-empty">

              <h2>
                No records added
              </h2>

              <p>
                Add records from the available
                data sources to begin building
                a match.
              </p>

              <button
                className="primary-button"
                onClick={openAddRecord}
              >
                Add New Record
              </button>

            </div>
          )}

        {addingRecord && (
          <AddRecordSearch
            search={search}
            setSearch={setSearch}
            results={searchResults}
            onAdd={addRecord}
            onClose={closeAddRecord}
          />
        )}

        {matchedRecords.length > 0 &&
          !addingRecord && (
            <div className="matcher-add-another">
              <button
                className="primary-button"
                onClick={openAddRecord}
              >
                Add Another Record
              </button>
            </div>
          )}

      </div>

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
  onRemove
}) {
  return (
    <div className="matcher-records">

      {records.map(record => (
        <div
          key={record.id}
          className="matcher-record"
        >

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

        </div>
      ))}

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