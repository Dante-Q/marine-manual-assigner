import { useMemo, useState } from "react";

import LeafletMap from "../components/map/LeafletMap.jsx";

function RecordMap({ records, savedRecords }) {
  const [selectedSource, setSelectedSource] = useState("all");

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

  return (
    <section className="record-map-page">
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
          onSelect={setSelectedSource}
        />
        <SourceFilter
          source="tyha"
          label="TYHA"
          count={counts.tyha}
          selectedSource={selectedSource}
          onSelect={setSelectedSource}
        />
        <SourceFilter
          source="marinas-com"
          label="Marinas.com"
          count={counts["marinas-com"]}
          selectedSource={selectedSource}
          onSelect={setSelectedSource}
        />
        <SourceFilter
          source="osm"
          label="OSM"
          count={counts.osm}
          selectedSource={selectedSource}
          onSelect={setSelectedSource}
        />
        <SourceFilter
          source="saved"
          label="Saved Records"
          count={counts.saved}
          selectedSource={selectedSource}
          onSelect={setSelectedSource}
        />
      </div>

      <div className="record-map-frame">
        <LeafletMap records={visibleRecords} />
      </div>
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
