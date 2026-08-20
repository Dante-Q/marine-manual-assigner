import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import LeafletMap from "../components/map/LeafletMap.jsx";
import MasterRecord from "../components/matcher/MasterRecord.jsx";
import SourceRecord from "../components/matcher/SourceRecord.jsx";
import {
  deleteRawRecord,
  saveMatch,
  updateRawRecord,
  updateMatch
} from "../api/api.js";

function RecordMap({
  records,
  setRecords,
  savedRecords,
  setSavedRecords,
  mapView,
  onMapViewChange
}) {
  const [selectedSources, setSelectedSources] = useState(() => new Set(["all"]));
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [sourceRecords, setSourceRecords] = useState([]);
  const [activeMatchTab, setActiveMatchTab] = useState("master");
  const [rawDraft, setRawDraft] = useState(null);
  const [hideMatchedPins, setHideMatchedPins] = useState(false);
  const [mapSearch, setMapSearch] = useState("");
  const [mapFocusRecord, setMapFocusRecord] = useState(null);
  const [mapFocusToken, setMapFocusToken] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(null);
  const pageRef = useRef(null);
  const editorRef = useRef(null);

  const counts = useMemo(() => ({
    all: records.length + savedRecords.length,
    tyha: records.filter(record => record.source === "tyha").length,
    "marinas-com": records.filter(
      record => record.source === "marinas-com"
    ).length,
    osm: records.filter(record => record.source === "osm").length,
    "tyha-IE": records.filter(record => record.source === "tyha-IE").length,
    "marinas-com-IE": records.filter(
      record => record.source === "marinas-com-IE"
    ).length,
    "osm-IE": records.filter(record => record.source === "osm-IE").length,
    saved: savedRecords.length
  }), [records, savedRecords]);

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
  }, [savedRecords]);

  const visibleRecords = useMemo(() => {
    const showAllSources = selectedSources.has("all");
    const savedPins = (showAllSources || selectedSources.has("saved"))
      ? savedRecords.map(record => ({
          ...record,
          mapSource: "saved"
        }))
      : [];

    const rawPins = records.filter(record => {
      const matchesSource =
        showAllSources ||
        selectedSources.has(record.source);

      return (
        matchesSource &&
        (!hideMatchedPins || !matchedRecordIds.has(record.id))
      );
    });

    return [...rawPins, ...savedPins].filter(hasCoordinates);
  }, [
    records,
    savedRecords,
    selectedSources,
    hideMatchedPins,
    matchedRecordIds
  ]);

  const mapRecords = useMemo(() => {
    if (selectedRecord?.source === "manual" && hasCoordinates(selectedRecord)) {
      return [...visibleRecords, selectedRecord];
    }

    if (!rawDraft || !hasCoordinates(rawDraft)) {
      return visibleRecords;
    }

    return visibleRecords.map(record =>
      record.id === rawDraft.id
        ? {
            ...record,
            latitude: rawDraft.latitude,
            longitude: rawDraft.longitude
          }
        : record
    );
  }, [visibleRecords, rawDraft, selectedRecord]);

  const mapSearchResults = useMemo(() => {
    const query = mapSearch.trim().toLowerCase();

    if (!query) return [];

    return [
      ...records,
      ...savedRecords.map(record => ({ ...record, mapSource: "saved" }))
    ]
      .filter(hasCoordinates)
      .filter(record => {
        const searchable = [
          record.name,
          record.id,
          record.source,
          record.mapSource,
          JSON.stringify(record.address)
        ].filter(Boolean).join(" ").toLowerCase();

        return searchable.includes(query);
      })
      .slice(0, 8);
  }, [records, savedRecords, mapSearch]);

  const handleSelectRecord = useCallback(record => {
    setSelectedRecord({ ...record });
    setSourceRecords([]);
    setActiveMatchTab("master");
    setSaveError(null);
    setSaveSuccess(null);
  }, []);

  const handleAddSourceRecord = useCallback(record => {
    setSourceRecords(current => {
      if (current.some(source => source.id === record.id)) {
        return current;
      }

      return [...current, { ...record }];
    });
    setActiveMatchTab(`source:${record.id}`);
  }, []);

  const handleEditRawRecord = useCallback(record => {
    setRawDraft({ ...record });
    setSaveError(null);
    setSaveSuccess(null);
  }, []);

  function handleAddManualRecord() {
    const latitude = mapView?.latitude ?? 54.5;
    const longitude = mapView?.longitude ?? -3;

    setSelectedRecord({
      id: "manual:draft",
      source: "manual",
      name: "",
      type: "marina",
      description: "",
      latitude: Number(latitude.toFixed(6)),
      longitude: Number(longitude.toFixed(6)),
      address: { street: null, city: null, postcode: null, country: null },
      phone: "",
      email: "",
      website: "",
      berths: "",
      facilities: [],
      images: []
    });
    setRawDraft(null);
    setSourceRecords([]);
    setActiveMatchTab("master");
    setSaveError(null);
    setSaveSuccess(null);
  }

  function handleManualPinMove({ latitude, longitude }) {
    setSelectedRecord(current => current?.source === "manual"
      ? { ...current, latitude, longitude }
      : current
    );
  }

  useEffect(() => {
    if (selectedRecord || rawDraft) {
      pageRef.current?.scrollTo({
        top: editorRef.current?.offsetTop ?? 0,
        behavior: "smooth",
      });
    }
  }, [selectedRecord, rawDraft]);

  function handleSourceChange(source) {
    setSelectedSources(current => {
      if (source === "all") {
        return new Set(["all"]);
      }

      const next = new Set(current);

      if (next.has("all")) {
        return new Set([source]);
      }

      if (next.has(source)) {
        next.delete(source);
      } else {
        next.add(source);
      }

      return next;
    });
    setSelectedRecord(null);
    setSourceRecords([]);
    setActiveMatchTab("master");
    setSaveError(null);
    setSaveSuccess(null);
  }

  function focusMapRecord(record) {
    setSelectedSources(new Set(["all"]));
    setMapFocusRecord(record);
    setMapFocusToken(current => current + 1);
    setMapSearch("");
  }

  function updateSelectedRecord(field, value) {
    setSelectedRecord(current => ({
      ...current,
      [field]: value
    }));
  }

  function updateRawDraft(field, value) {
    setRawDraft(current => ({
      ...current,
      [field]: value
    }));
  }

  async function saveRawDraft() {
    if (!rawDraft) return;

    if (!window.confirm(
      `Save changes to raw record “${rawDraft.name || rawDraft.id}”?`
    )) return;

    setSaving(true);
    setSaveError(null);

    try {
      const updated = await updateRawRecord(rawDraft.id, rawDraft);
      setRecords(current => current.map(record =>
        record.id === updated.id ? updated : record
      ));
      setRawDraft(null);
      setSaveSuccess("Raw record updated.");
    } catch (error) {
      setSaveError(error.message || "Failed to update raw record.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteRawRecord(record) {
    if (!window.confirm(
      `Delete raw record “${record.name || record.id}”? This cannot be undone.`
    )) return;

    try {
      await deleteRawRecord(record.id);
      setRecords(current => current.filter(item => item.id !== record.id));
      setSourceRecords(current => current.filter(item => item.id !== record.id));
      setSaveSuccess("Raw record deleted.");
    } catch (error) {
      setSaveError(error.message || "Failed to delete raw record.");
    }
  }

  function removeSourceRecord(recordId) {
    setSourceRecords(current =>
      current.filter(record => record.id !== recordId)
    );
    setActiveMatchTab("master");
  }

  async function saveSelectedRecord() {
    if (!selectedRecord) {
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      const { mapSource, ...recordToSave } = selectedRecord;
      const editingSavedRecord = mapSource === "saved";

      const savedRecord = editingSavedRecord
        ? await updateMatch(recordToSave.id, recordToSave)
        : await saveMatch({
            masterRecord: recordToSave,
            sourceRecords
          });

      setSavedRecords(current =>
        editingSavedRecord
          ? current.map(record =>
              record.id === savedRecord.id
                ? savedRecord
                : record
            )
          : [...current, savedRecord]
      );
      setSaveSuccess(
        editingSavedRecord
          ? `${savedRecord.id} was updated in data/saved.`
          : `${savedRecord.id} was saved without changing the raw source record.`
      );
      setSelectedRecord(null);
      setSourceRecords([]);
      setActiveMatchTab("master");
    } catch (error) {
      console.error(error);
      setSaveError(
        error.message || "Failed to save the master record."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section ref={pageRef} className="record-map-page">
      <header className="record-map-header">
        <div>
          <h2>Record Map</h2>
          <p>
            {visibleRecords.length} mapped location
            {visibleRecords.length === 1 ? "" : "s"}
          </p>
        </div>
        <button
          className="primary-button"
          onClick={handleAddManualRecord}
          disabled={saving}
        >
          Add manual record
        </button>
      </header>

      <div className="record-map-search">
        <input
          type="search"
          placeholder="Search a record on the map..."
          value={mapSearch}
          onChange={event => setMapSearch(event.target.value)}
        />

        {mapSearchResults.length > 0 && (
          <div className="record-map-search-results">
            {mapSearchResults.map(record => (
              <button
                key={`${record.mapSource ?? record.source}:${record.id}`}
                onClick={() => focusMapRecord(record)}
              >
                <span>
                  <strong>{record.name || "Unnamed marina"}</strong>
                  <small>{record.id}</small>
                </span>
                <em>{getMapSourceName(record.mapSource ?? record.source)}</em>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="record-map-filters" aria-label="Filter map records by source">
        <SourceFilter
          source="all"
          label="All Records"
          count={counts.all}
          selected={selectedSources.has("all")}
          onSelect={handleSourceChange}
        />
        <SourceFilter
          source="tyha"
          label="TYHA"
          count={counts.tyha}
          selected={selectedSources.has("tyha")}
          onSelect={handleSourceChange}
        />
        <SourceFilter
          source="marinas-com"
          label="Marinas.com"
          count={counts["marinas-com"]}
          selected={selectedSources.has("marinas-com")}
          onSelect={handleSourceChange}
        />
        <SourceFilter
          source="osm"
          label="OSM"
          count={counts.osm}
          selected={selectedSources.has("osm")}
          onSelect={handleSourceChange}
        />
        <SourceFilter
          source="tyha-IE"
          label="TYHA-IE"
          count={counts["tyha-IE"]}
          selected={selectedSources.has("tyha-IE")}
          onSelect={handleSourceChange}
        />
        <SourceFilter
          source="marinas-com-IE"
          label="Marinas.com-IE"
          count={counts["marinas-com-IE"]}
          selected={selectedSources.has("marinas-com-IE")}
          onSelect={handleSourceChange}
        />
        <SourceFilter
          source="osm-IE"
          label="OSM-IE"
          count={counts["osm-IE"]}
          selected={selectedSources.has("osm-IE")}
          onSelect={handleSourceChange}
        />
        <SourceFilter
          source="saved"
          label="Saved Records"
          count={counts.saved}
          selected={selectedSources.has("saved")}
          onSelect={handleSourceChange}
        />
      </div>

      <div className="record-map-controls">
        <div className="record-map-legend" aria-label="Map pin colors">
          <LegendItem source="tyha" label="TYHA" />
          <LegendItem source="marinas-com" label="Marinas.com" />
          <LegendItem source="osm" label="OpenStreetMap" />
          <LegendItem source="tyha-IE" label="TYHA-IE" />
          <LegendItem source="marinas-com-IE" label="Marinas.com-IE" />
          <LegendItem source="osm-IE" label="OpenStreetMap-IE" />
          <LegendItem source="saved" label="Saved Record" />
        </div>

        <div className="record-map-toggles">
          <label>
            <input
              type="checkbox"
              checked={hideMatchedPins}
              onChange={event =>
                setHideMatchedPins(event.target.checked)
              }
            />
            Hide matched raw pins
          </label>

        </div>
      </div>

      <div className="record-map-frame">
        <LeafletMap
          records={mapRecords}
          onSelectRecord={handleSelectRecord}
          onAddSourceRecord={
            !selectedRecord ||
            selectedRecord.mapSource === "saved"
              ? undefined
              : handleAddSourceRecord
          }
          onEditRawRecord={handleEditRawRecord}
          onDeleteRawRecord={handleDeleteRawRecord}
          masterRecordId={selectedRecord?.id}
          sourceRecordIds={sourceRecords.map(record => record.id)}
          initialView={mapView}
          onViewChange={onMapViewChange}
          focusedRecord={rawDraft ?? mapFocusRecord}
          focusToken={mapFocusToken}
          focusZoom={Boolean(mapFocusRecord) && !rawDraft}
          draggableRecordId={
            selectedRecord?.source === "manual"
              ? selectedRecord.id
              : undefined
          }
          onRecordMove={handleManualPinMove}
        />
      </div>

      {saveSuccess && (
        <div className="record-map-notice success">
          {saveSuccess}
        </div>
      )}

      {saveError && (
        <div className="record-map-notice error">
          {saveError}
        </div>
      )}

      {selectedRecord && (
        <section
          ref={editorRef}
          className="record-map-editor"
        >
          <div className="record-map-editor-header">
            <div>
              <h2>
                {selectedRecord.source === "manual"
                  ? "Add manual record"
                  : selectedRecord.mapSource === "saved"
                  ? "Edit saved record"
                  : "Edit new master record"}
              </h2>
              <p>
                {selectedRecord.source === "manual"
                  ? "Drag the blue pin on the map to autofill latitude and longitude, then complete the form."
                  : selectedRecord.mapSource === "saved"
                  ? "Changes update this record in data/saved."
                  : "Changes are saved as a new record in data/saved. The raw source data is never overwritten."}
              </p>
            </div>

            <button
              className="secondary-button"
              onClick={() => setSelectedRecord(null)}
              disabled={saving}
            >
              Close editor
            </button>
          </div>

          {selectedRecord.mapSource !== "saved" && (
            <div
              className="record-map-match-tabs"
              role="tablist"
              aria-label="Match records"
            >
              <button
                className={activeMatchTab === "master" ? "active" : ""}
                onClick={() => setActiveMatchTab("master")}
                role="tab"
                aria-selected={activeMatchTab === "master"}
              >
                Master Record
              </button>

              {sourceRecords.map((record, index) => {
                const tabId = `source:${record.id}`;

                return (
                  <button
                    key={record.id}
                    className={activeMatchTab === tabId ? "active" : ""}
                    onClick={() => setActiveMatchTab(tabId)}
                    role="tab"
                    aria-selected={activeMatchTab === tabId}
                  >
                    Source {index + 1}
                  </button>
                );
              })}
            </div>
          )}

          {activeMatchTab === "master" || selectedRecord.mapSource === "saved" ? (
            <>
              <MasterRecord
                record={selectedRecord}
                onChange={updateSelectedRecord}
                onSave={saveSelectedRecord}
                saving={saving}
                locationEditable
                sourceName={
                  selectedRecord.source === "manual"
                    ? "Manual entry"
                    : selectedRecord.mapSource === "saved"
                    ? "Saved record"
                    : undefined
                }
                saveLabel={
                  selectedRecord.mapSource === "saved"
                    ? "Save Changes"
                    : selectedRecord.source === "manual"
                    ? "Add Record"
                    : "Save Record"
                }
              />

              {selectedRecord.mapSource !== "saved" && (
                <p className="record-map-source-hint">
                  Select another raw map pin and use “Add as source” to add
                  it as a tab in this match.
                </p>
              )}
            </>
          ) : (
            sourceRecords
              .filter(record =>
                `source:${record.id}` === activeMatchTab
              )
              .map(record => (
                <SourceRecord
                  key={record.id}
                  record={record}
                  onRemove={removeSourceRecord}
                />
              ))
          )}
        </section>
      )}

      {rawDraft && (
        <section ref={editorRef} className="record-map-editor raw-editor">
          <div className="record-map-editor-header">
            <div>
              <h2>Edit raw source data</h2>
              <p>
                Saving writes directly to the raw source file after
                confirmation.
              </p>
            </div>

            <button
              className="secondary-button"
              onClick={() => setRawDraft(null)}
              disabled={saving}
            >
              Close editor
            </button>
          </div>

          <MasterRecord
            record={rawDraft}
            onChange={updateRawDraft}
            onSave={saveRawDraft}
            saving={saving}
            sourceName="Raw source record"
            saveLabel="Save Raw Changes"
            recordLabel="Raw Record"
            recordLabelClassName="raw-record-label"
            sourceBadge={getRawSourceLabel(rawDraft.source)}
          />
        </section>
      )}
    </section>
  );
}

function LegendItem({ source, label }) {
  return (
    <span className="record-map-legend-item">
      <i className={`record-map-legend-pin ${source}`} />
      {label}
    </span>
  );
}

function SourceFilter({ source, label, count, selected, onSelect }) {
  return (
    <button
      className={`record-map-filter ${
        selected ? "active" : ""
      }`}
      onClick={() => onSelect(source)}
      aria-pressed={selected}
    >
      {label}
      <span>{count}</span>
    </button>
  );
}

function hasCoordinates(record) {
  const latitude = Number(record.latitude);
  const longitude = Number(record.longitude);

  return (
    record.latitude !== null &&
    record.latitude !== undefined &&
    record.latitude !== "" &&
    record.longitude !== null &&
    record.longitude !== undefined &&
    record.longitude !== "" &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

function getRawSourceLabel(source) {
  const labels = {
    tyha: "TYHA",
    "marinas-com": "Marinas.com",
    osm: "OSM",
    "tyha-IE": "TYHA-IE",
    "marinas-com-IE": "Marinas.com-IE",
    "osm-IE": "OSM-IE"
  };

  return labels[source] ?? source;
}

function getMapSourceName(source) {
  const names = {
    tyha: "TYHA",
    "marinas-com": "Marinas.com",
    osm: "OSM",
    "tyha-IE": "TYHA-IE",
    "marinas-com-IE": "Marinas.com-IE",
    "osm-IE": "OSM-IE",
    saved: "Saved"
  };

  return names[source] ?? source;
}

export default RecordMap;
