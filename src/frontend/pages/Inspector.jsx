import { useMemo, useState } from "react";

function Inspector({
  records,
  matchedRecords,
  setMatchedRecords
}) {
  const [selectedSource, setSelectedSource] =
    useState("all");

  const [selectedRecord, setSelectedRecord] =
    useState(null);

  const [search, setSearch] =
    useState("");

  const counts = useMemo(() => {
    return {
      all: records.length,

      tyha: records.filter(
        record => record.source === "tyha"
      ).length,

      "marinas-com": records.filter(
        record =>
          record.source === "marinas-com"
      ).length,

      osm: records.filter(
        record => record.source === "osm"
      ).length
    };
  }, [records]);

  const filteredRecords = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return records.filter(record => {
      if (
        selectedSource !== "all" &&
        record.source !== selectedSource
      ) {
        return false;
      }

      if (!query) {
        return true;
      }

      const name =
        record.name?.toLowerCase() ?? "";

      const address =
        JSON.stringify(
          record.address
        ).toLowerCase();

      return (
        name.includes(query) ||
        address.includes(query)
      );
    });
  }, [
    records,
    selectedSource,
    search
  ]);

  function handleSourceChange(source) {
    setSelectedSource(source);
    setSelectedRecord(null);
  }

  function isMatched(recordId) {
    return matchedRecords.some(
      record => record.id === recordId
    );
  }

  function addToMatcher(record) {
    if (isMatched(record.id)) {
      return;
    }

    setMatchedRecords(current => [
      ...current,
      record
    ]);
  }

  function removeFromMatcher(recordId) {
    setMatchedRecords(current =>
      current.filter(
        record => record.id !== recordId
      )
    );
  }

  return (
    <div className="inspector">

      <aside className="sidebar">

        <section>

          <h2>
            Data Sources
          </h2>

          <SourceButton
            source="all"
            label="All Records"
            count={counts.all}
            selected={selectedSource}
            onClick={handleSourceChange}
          />

          <SourceButton
            source="tyha"
            label="TYHA"
            count={counts.tyha}
            selected={selectedSource}
            onClick={handleSourceChange}
          />

          <SourceButton
            source="marinas-com"
            label="Marinas.com"
            count={counts["marinas-com"]}
            selected={selectedSource}
            onClick={handleSourceChange}
          />

          <SourceButton
            source="osm"
            label="OSM"
            count={counts.osm}
            selected={selectedSource}
            onClick={handleSourceChange}
          />

        </section>

      </aside>

      <section className="records-panel">

        <div className="records-header">

          <div>

            <h2>
              {getSourceName(
                selectedSource
              )}
            </h2>

            <span>
              {filteredRecords.length} records
            </span>

          </div>

          <input
            type="search"
            placeholder="Search records..."
            value={search}
            onChange={event =>
              setSearch(event.target.value)
            }
          />

        </div>

        <div className="content">

          <div className="record-list">

            {filteredRecords.length === 0 ? (
              <div className="empty-list">
                No records found.
              </div>
            ) : (
              filteredRecords.map(record => (
                <button
                  key={record.id}
                  className={`record-item ${
                    selectedRecord?.id === record.id
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    setSelectedRecord(record)
                  }
                >

                  <div className="record-item-title">

                    <strong>
                      {record.name ||
                        "Unnamed marina"}
                    </strong>

                    <span className="source-label">
                      {getSourceName(
                        record.source
                      )}
                    </span>

                  </div>

                  <span>
                    {formatLocation(record)}
                  </span>

                </button>
              ))
            )}

          </div>

          <div className="record-detail">

            {selectedRecord ? (
              <RecordDetail
                record={selectedRecord}
                matched={isMatched(
                  selectedRecord.id
                )}
                onAdd={addToMatcher}
                onRemove={removeFromMatcher}
              />
            ) : (
              <div className="empty-state">

                <h2>
                  Select a record
                </h2>

                <p>
                  Select a marina from the list
                  to view its details.
                </p>

              </div>
            )}

          </div>

        </div>

      </section>

    </div>
  );
}

function SourceButton({
  source,
  label,
  count,
  selected,
  onClick
}) {
  return (
    <button
      className={`source-button ${
        selected === source
          ? "active"
          : ""
      }`}
      onClick={() => onClick(source)}
    >

      <span>
        {label}
      </span>

      <span className="count">
        {count}
      </span>

    </button>
  );
}

function RecordDetail({
  record,
  matched,
  onAdd,
  onRemove
}) {
  return (
    <>
      <div className="detail-header">

        <div>

          <span className="source-label">
            {getSourceName(record.source)}
          </span>

          <h2>
            {record.name ||
              "Unnamed marina"}
          </h2>

        </div>

        <div className="detail-actions">

          {matched ? (
            <button
              className="remove-record-button"
              onClick={() =>
                onRemove(record.id)
              }
            >
              Remove from Match
            </button>
          ) : (
            <button
              className="primary-button"
              onClick={() =>
                onAdd(record)
              }
            >
              Add to Matcher
            </button>
          )}

        </div>

      </div>

      <div className="detail-grid">

        <DetailField
          label="ID"
          value={record.id}
        />

        <DetailField
          label="Source"
          value={record.source}
        />

        <DetailField
          label="Source File"
          value={record.sourceFile}
        />

        <DetailField
          label="Description"
          value={record.description}
        />

        <DetailField
          label="Location"
          value={formatCoordinates(
            record.latitude,
            record.longitude
          )}
        />

        <DetailField
          label="Address"
          value={formatAddress(
            record.address
          )}
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
        />

        <DetailField
          label="Berths"
          value={record.berths}
        />

        <DetailField
          label="Facilities"
          value={formatJsonValue(
            record.facilities
          )}
        />

        <DetailField
          label="Images"
          value={formatJsonValue(
            record.images
          )}
        />

        <DetailField
          label="Source URL"
          value={record.sourceUrl}
          link
        />

      </div>

      <div className="raw-section">

        <div className="raw-section-header">

          <h3>
            Complete Record
          </h3>

          <span className="raw-description">
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
    </>
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
      <div className="detail-field">

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
    <div className="detail-field">

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

  if (
    typeof address === "string"
  ) {
    return address;
  }

  if (
    Array.isArray(address)
  ) {
    return (
      address
        .filter(Boolean)
        .join(", ") ||
      null
    );
  }

  if (
    typeof address === "object"
  ) {
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
    all: "All Records",
    tyha: "TYHA",
    "marinas-com": "Marinas.com",
    osm: "OpenStreetMap"
  };

  return (
    names[source] ??
    source
  );
}

export default Inspector;