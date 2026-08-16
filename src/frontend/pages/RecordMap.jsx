import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import LeafletMap from "../components/map/LeafletMap.jsx";
import MasterRecord from "../components/matcher/MasterRecord.jsx";
import { saveMatch } from "../api/api.js";

function RecordMap({
  records,
  savedRecords,
  setSavedRecords
}) {
  const [selectedSource, setSelectedSource] = useState("all");
  const [selectedRecord, setSelectedRecord] = useState(null);
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

  const visibleRecords = useMemo(() => {
    const candidates =
      selectedSource === "saved"
        ? savedRecords.map(record => ({ ...record, source: "saved" }))
        : records.filter(
            record =>
              selectedSource === "all" ||
              record.source === selectedSource
          );

    return candidates.filter(hasCoordinates);
  }, [records, savedRecords, selectedSource]);

  const handleSelectRecord = useCallback(record => {
    setSelectedRecord({ ...record });
    setSaveError(null);
    setSaveSuccess(null);
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
    setSaveError(null);
    setSaveSuccess(null);
  }

  function updateSelectedRecord(field, value) {
    setSelectedRecord(current => ({
      ...current,
      [field]: value
    }));
  }

  async function saveSelectedRecord() {
    if (!selectedRecord) {
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      const savedRecord = await saveMatch({
        masterRecord: selectedRecord,
        sourceRecords: []
      });

      setSavedRecords(current => [
        ...current,
        savedRecord
      ]);
      setSaveSuccess(
        `${savedRecord.id} was saved without changing the raw source record.`
      );
      setSelectedRecord(null);
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

      <div className="record-map-frame">
        <LeafletMap
          records={visibleRecords}
          onSelectRecord={
            selectedSource === "saved"
              ? undefined
              : handleSelectRecord
          }
        />
      </div>

      {selectedSource === "saved" && (
        <p className="record-map-help">
          Saved records are shown for reference. Select a raw source filter
          to create a new master record from a map pin.
        </p>
      )}

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
              <h2>Edit new master record</h2>
              <p>
                Changes are saved as a new record in data/saved. The raw
                source data is never overwritten.
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
          />
        </section>
      )}
    </section>
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
