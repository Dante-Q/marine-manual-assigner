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
  saveMatch,
  updateMatch
} from "../api/api.js";

function RecordMap({
  records,
  savedRecords,
  setSavedRecords,
  mapView,
  onMapViewChange
}) {
  const [selectedSource, setSelectedSource] = useState("all");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [sourceRecords, setSourceRecords] = useState([]);
  const [hideMatchedPins, setHideMatchedPins] = useState(false);
  const [showSavedPins, setShowSavedPins] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(null);
  const pageRef = useRef(null);
  const editorRef = useRef(null);

  const counts = useMemo(() => ({
    all: records.length,
    tyha: records.filter(record => record.source === "tyha").length,
    "marinas-com": records.filter(
      record => record.source === "marinas-com"
    ).length,
    osm: records.filter(record => record.source === "osm").length,
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
    const savedPins = showSavedPins
      ? savedRecords.map(record => ({
          ...record,
          mapSource: "saved"
        }))
      : [];

    if (selectedSource === "saved") {
      return savedPins.filter(hasCoordinates);
    }

    const rawPins = records.filter(record => {
      const matchesSource =
        selectedSource === "all" ||
        record.source === selectedSource;

      return (
        matchesSource &&
        (!hideMatchedPins || !matchedRecordIds.has(record.id))
      );
    });

    return [...rawPins, ...savedPins].filter(hasCoordinates);
  }, [
    records,
    savedRecords,
    selectedSource,
    hideMatchedPins,
    showSavedPins,
    matchedRecordIds
  ]);

  const handleSelectRecord = useCallback(record => {
    setSelectedRecord({ ...record });
    setSourceRecords([]);
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
  }, []);

  useEffect(() => {
    if (selectedRecord) {
      pageRef.current?.scrollTo({
        top: editorRef.current?.offsetTop ?? 0,
        behavior: "smooth",
      });
    }
  }, [selectedRecord]);

  function handleSourceChange(source) {
    setSelectedSource(source);
    setSelectedRecord(null);
    setSourceRecords([]);
    setSaveError(null);
    setSaveSuccess(null);
  }

  function updateSelectedRecord(field, value) {
    setSelectedRecord(current => ({
      ...current,
      [field]: value
    }));
  }

  function removeSourceRecord(recordId) {
    setSourceRecords(current =>
      current.filter(record => record.id !== recordId)
    );
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
      </header>

      <div className="record-map-filters" aria-label="Filter map records by source">
        <SourceFilter
          source="all"
          label="All Records"
          count={counts.all}
          selectedSource={selectedSource}
          onSelect={handleSourceChange}
        />
        <SourceFilter
          source="tyha"
          label="TYHA"
          count={counts.tyha}
          selectedSource={selectedSource}
          onSelect={handleSourceChange}
        />
        <SourceFilter
          source="marinas-com"
          label="Marinas.com"
          count={counts["marinas-com"]}
          selectedSource={selectedSource}
          onSelect={handleSourceChange}
        />
        <SourceFilter
          source="osm"
          label="OSM"
          count={counts.osm}
          selectedSource={selectedSource}
          onSelect={handleSourceChange}
        />
        <SourceFilter
          source="saved"
          label="Saved Records"
          count={counts.saved}
          selectedSource={selectedSource}
          onSelect={handleSourceChange}
        />
      </div>

      <div className="record-map-controls">
        <div className="record-map-legend" aria-label="Map pin colors">
          <LegendItem source="tyha" label="TYHA" />
          <LegendItem source="marinas-com" label="Marinas.com" />
          <LegendItem source="osm" label="OpenStreetMap" />
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

          <label>
            <input
              type="checkbox"
              checked={showSavedPins}
              onChange={event =>
                setShowSavedPins(event.target.checked)
              }
            />
            Show saved pins
          </label>
        </div>
      </div>

      <div className="record-map-frame">
        <LeafletMap
          records={visibleRecords}
          onSelectRecord={handleSelectRecord}
          onAddSourceRecord={
            selectedRecord?.mapSource === "saved"
              ? undefined
              : handleAddSourceRecord
          }
          masterRecordId={selectedRecord?.id}
          sourceRecordIds={sourceRecords.map(record => record.id)}
          initialView={mapView}
          onViewChange={onMapViewChange}
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
                {selectedRecord.mapSource === "saved"
                  ? "Edit saved record"
                  : "Edit new master record"}
              </h2>
              <p>
                {selectedRecord.mapSource === "saved"
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

          <MasterRecord
            record={selectedRecord}
            onChange={updateSelectedRecord}
            onSave={saveSelectedRecord}
            saving={saving}
            sourceName={
              selectedRecord.mapSource === "saved"
                ? "Saved record"
                : undefined
            }
            saveLabel={
              selectedRecord.mapSource === "saved"
                ? "Save Changes"
                : "Save Record"
            }
          />

          {selectedRecord.mapSource !== "saved" && (
            <section className="record-map-source-records">
              <div className="source-records-header">
                <div>
                  <h2>Source Records</h2>
                  <p>
                    Use “Add as source” in another raw map pin’s popup to
                    include it in this match.
                  </p>
                </div>
              </div>

              {sourceRecords.length === 0 ? (
                <div className="record-map-source-empty">
                  No additional source records selected.
                </div>
              ) : (
                <div className="source-record-list">
                  {sourceRecords.map(record => (
                    <SourceRecord
                      key={record.id}
                      record={record}
                      onRemove={removeSourceRecord}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
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

function SourceFilter({ source, label, count, selectedSource, onSelect }) {
  return (
    <button
      className={`record-map-filter ${
        selectedSource === source ? "active" : ""
      }`}
      onClick={() => onSelect(source)}
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

export default RecordMap;
