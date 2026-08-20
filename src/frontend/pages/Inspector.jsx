import { useEffect, useMemo, useState } from "react";

import LocationMap from "../components/LocationMap.jsx";
import MasterRecord from "../components/matcher/MasterRecord.jsx";
import { updateMatch } from "../api/api.js";

function Inspector({
  records,
  savedRecords,
  setSavedRecords,
  onCreateMaster,
  serviceOptions
}) {
  const [selectedSource, setSelectedSource] =
    useState("all");

  const [selectedRecord, setSelectedRecord] =
    useState(null);

  const [search, setSearch] =
    useState("");

  const [matchFilter, setMatchFilter] =
    useState("all");

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

      "tyha-IE": records.filter(
        record => record.source === "tyha-IE"
      ).length,

      "marinas-com-IE": records.filter(
        record => record.source === "marinas-com-IE"
      ).length,

      "osm-IE": records.filter(
        record => record.source === "osm-IE"
      ).length,

      osm: records.filter(
        record => record.source === "osm"
      ).length,

      saved: savedRecords.length
    };
  }, [
    records,
    savedRecords
  ]);

  /*
   * Build a Set containing every raw source-record
   * ID that has already been used in a saved master.
   *
   * Saved records are the source of truth.
   * Raw records are never modified.
   */
  const matchedRecordIds = useMemo(() => {
    const ids = new Set();

    for (const savedRecord of savedRecords) {
      for (
        const sourceRecord
        of savedRecord.sourceRecords ?? []
      ) {
        if (sourceRecord.id) {
          ids.add(sourceRecord.id);
        }
      }
    }

    return ids;
  }, [
    savedRecords
  ]);

  const filteredRecords = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    /*
     * Saved Records
     */
    if (selectedSource === "saved") {
      return savedRecords.filter(record => {
        if (!query) {
          return true;
        }

        const name =
          record.name?.toLowerCase() ?? "";

        const address =
          JSON.stringify(
            record.address
          ).toLowerCase();

        const id =
          record.id?.toLowerCase() ?? "";

        return (
          name.includes(query) ||
          address.includes(query) ||
          id.includes(query)
        );
      });
    }

    /*
     * Raw Records
     */
    return records.filter(record => {
      /*
       * Source filter
       */
      if (
        selectedSource !== "all" &&
        record.source !== selectedSource
      ) {
        return false;
      }

      /*
       * Match filter.
       *
       * This is intentionally only applied
       * when viewing All Records.
       */
      if (
        selectedSource === "all" &&
        matchFilter !== "all"
      ) {
        const matched =
          matchedRecordIds.has(record.id);

        if (
          matchFilter === "matched" &&
          !matched
        ) {
          return false;
        }

        if (
          matchFilter === "unmatched" &&
          matched
        ) {
          return false;
        }
      }

      /*
       * Search filter
       */
      if (!query) {
        return true;
      }

      const name =
        record.name?.toLowerCase() ?? "";

      const address =
        JSON.stringify(
          record.address
        ).toLowerCase();

      const id =
        record.id?.toLowerCase() ?? "";

      const source =
        record.source?.toLowerCase() ?? "";

      return (
        name.includes(query) ||
        address.includes(query) ||
        id.includes(query) ||
        source.includes(query)
      );
    });
  }, [
    records,
    savedRecords,
    selectedSource,
    matchFilter,
    matchedRecordIds,
    search
  ]);

  function handleSourceChange(source) {
    setSelectedSource(source);
    setSelectedRecord(null);
    setSearch("");

    /*
     * Reset the match filter when leaving
     * All Records so it doesn't unexpectedly
     * affect another source view.
     */
    if (source !== "all") {
      setMatchFilter("all");
    }
  }

  function handleMatchFilterChange(filter) {
    setMatchFilter(filter);
    setSelectedRecord(null);
  }

  function isMatched(recordId) {
    return matchedRecordIds.has(recordId);
  }

  const showingSaved =
    selectedSource === "saved";

  const showingAll =
    selectedSource === "all";

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

          <SourceButton
            source="tyha-IE"
            label="TYHA-IE"
            count={counts["tyha-IE"]}
            selected={selectedSource}
            onClick={handleSourceChange}
          />

          <SourceButton
            source="marinas-com-IE"
            label="Marinas.com-IE"
            count={counts["marinas-com-IE"]}
            selected={selectedSource}
            onClick={handleSourceChange}
          />

          <SourceButton
            source="osm-IE"
            label="OSM-IE"
            count={counts["osm-IE"]}
            selected={selectedSource}
            onClick={handleSourceChange}
          />

          <SourceButton
            source="saved"
            label="Saved Records"
            count={counts.saved}
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

        {showingAll && (
          <div className="record-filters">

            <button
              className={`filter-button ${
                matchFilter === "all"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                handleMatchFilterChange("all")
              }
            >
              All
            </button>

            <button
              className={`filter-button ${
                matchFilter === "matched"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                handleMatchFilterChange(
                  "matched"
                )
              }
            >
              Matched
            </button>

            <button
              className={`filter-button ${
                matchFilter === "unmatched"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                handleMatchFilterChange(
                  "unmatched"
                )
              }
            >
              Unmatched
            </button>

          </div>
        )}

        <div className="content">

          <div className="record-list">

            {filteredRecords.length === 0 ? (
              <div className="empty-list">
                No records found.
              </div>
            ) : (
              filteredRecords.map(record => {

                const matched =
                  !showingSaved &&
                  isMatched(record.id);

                return (
                  <button
                    key={record.id}
                    className={`record-item ${
                      selectedRecord?.id === record.id
                        ? "selected"
                        : ""
                    } ${
                      matched
                        ? "matched"
                        : ""
                    } ${
                      showingSaved
                        ? "saved-record"
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
                        {showingSaved
                          ? "Saved"
                          : getSourceName(
                              record.source
                            )}
                      </span>

                      {showingSaved ? (
                        <span className="saved-badge">
                          {record.id}
                        </span>
                      ) : (
                        matched && (
                          <span className="matched-badge">
                            Matched
                          </span>
                        )
                      )}

                    </div>

                    <div className="record-item-meta">

                      <span>
                        {formatLocation(record)}
                      </span>

                    </div>

                  </button>
                );
              })
            )}

          </div>

          <div className="record-detail">

            {selectedRecord ? (
              showingSaved ? (
                <SavedRecordDetail
                  record={selectedRecord}
                  setSavedRecords={setSavedRecords}
                  serviceOptions={serviceOptions}
                />
              ) : (
                <RecordDetail
                  record={selectedRecord}
                  matched={isMatched(
                    selectedRecord.id
                  )}
                  onCreateMaster={onCreateMaster}
                />
              )
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
  onCreateMaster
}) {
  return (
    <>
      <div className="detail-header">

        <div>

          <div className="detail-source-row">

            <span className="source-label">
              {getSourceName(record.source)}
            </span>

            {matched && (
              <span className="matched-badge">
                Matched
              </span>
            )}

          </div>

          <h2>
            {record.name ||
              "Unnamed marina"}
          </h2>

        </div>

        <div className="detail-actions">

          <button
            className="primary-button"
            onClick={() => onCreateMaster(record)}
          >
            Create Master Record
          </button>

        </div>

      </div>

      <LocationMap
        latitude={record.latitude}
        longitude={record.longitude}
        name={record.name}
      />

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
          label="Services"
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

function SavedRecordDetail({
  record,
  setSavedRecords,
  serviceOptions
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(record);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setEditing(false);
    setDraft(record);
    setError(null);
  }, [record.id]);

  function updateDraft(field, value) {
    setDraft(current => ({
      ...current,
      [field]: value
    }));
  }

  async function saveChanges() {
    setSaving(true);
    setError(null);

    try {
      const saved = await updateMatch(record.id, draft);

      setSavedRecords(current =>
        current.map(item =>
          item.id === saved.id ? saved : item
        )
      );
      setDraft(saved);
      setEditing(false);
    } catch (saveError) {
      console.error(saveError);
      setError(
        saveError.message || "Failed to update saved record."
      );
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <>
        <div className="detail-header">
          <div>
            <div className="detail-source-row">
              <span className="source-label">Saved Record</span>
              <span className="saved-badge">{record.id}</span>
            </div>
            <h2>Edit Saved Record</h2>
          </div>

          <div className="detail-actions">
            <button
              className="secondary-button"
              onClick={() => {
                setDraft(record);
                setEditing(false);
              }}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </div>

        {error && <div className="inspector-save-error">{error}</div>}

        <MasterRecord
          record={draft}
          onChange={updateDraft}
          onSave={saveChanges}
          saving={saving}
          locationEditable
          serviceOptions={serviceOptions}
          sourceName="Saved record"
          recordLabel="Saved Record"
          saveLabel="Save Changes"
        />
      </>
    );
  }

  return (
    <>
      <div className="detail-header">

        <div>

          <div className="detail-source-row">

            <span className="source-label">
              Saved Record
            </span>

            <span className="saved-badge">
              {record.id}
            </span>

          </div>

          <h2>
            {record.name ||
              "Unnamed marina"}
          </h2>

        </div>

        <div className="detail-actions">
          <button
            className="primary-button"
            onClick={() => setEditing(true)}
          >
            Edit Record
          </button>
        </div>

      </div>

      <LocationMap
        latitude={record.latitude}
        longitude={record.longitude}
        name={record.name}
      />

      <div className="detail-grid">

        <DetailField
          label="Master ID"
          value={record.id}
        />

        <DetailField
          label="Name"
          value={record.name}
        />

        <DetailField
          label="Type"
          value={record.type}
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
          label="Services"
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
          label="Created"
          value={record.createdAt}
        />

        <DetailField
          label="Updated"
          value={record.updatedAt}
        />

      </div>

      <div className="raw-section">

        <div className="raw-section-header">

          <h3>
            Source Records
          </h3>

          <span className="raw-description">
            Raw records used to create this
            master record
          </span>

        </div>

        <pre>
          {JSON.stringify(
            record.sourceRecords ?? [],
            null,
            2
          )}
        </pre>

      </div>

      <div className="raw-section">

        <div className="raw-section-header">

          <h3>
            Complete Saved Record
          </h3>

          <span className="raw-description">
            Master record stored in
            data/saved
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
    osm: "OpenStreetMap",
    "tyha-IE": "TYHA-IE",
    "marinas-com-IE": "Marinas.com-IE",
    "osm-IE": "OpenStreetMap-IE",
    saved: "Saved Records"
  };

  return (
    names[source] ??
    source
  );
}

export default Inspector;
