function RecordSearch({
  search,
  setSearch,
  results,
  showMatchedRecords,
  setShowMatchedRecords,
  isMatched,
  onAdd,
  onClose
}) {
  return (
    <div className="add-record-panel">

      <div className="add-record-header">

        <div>
          <h3>
            Add Source Record
          </h3>

          <p>
            Search the raw source records and
            add one to this match.
          </p>
        </div>

        <button
          className="close-button"
          onClick={onClose}
          aria-label="Close record search"
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

      <label className="matcher-search-toggle">

        <input
          type="checkbox"
          checked={showMatchedRecords}
          onChange={event =>
            setShowMatchedRecords(
              event.target.checked
            )
          }
        />

        <span>
          Show previously matched records
        </span>

      </label>

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

              <div className="matcher-result-meta">

                <span className="matcher-result-source">
                  {getSourceName(record.source)}
                </span>

                {isMatched(record) && (
                  <span className="matched-badge">
                    Matched
                  </span>
                )}

                <span className="matcher-result-id">
                  {record.id}
                </span>

              </div>

            </button>
          ))
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

export default RecordSearch;
