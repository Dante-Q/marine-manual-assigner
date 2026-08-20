import { useEffect, useMemo, useState } from "react";

import {
  fetchRecords,
  fetchSavedRecords
} from "./api/api.js";

import Inspector from "./pages/Inspector.jsx";
import Matcher from "./pages/Matcher.jsx";
import RecordMap from "./pages/RecordMap.jsx";

function App() {
  const [records, setRecords] = useState([]);
  const [savedRecords, setSavedRecords] =
    useState([]);

  const [page, setPage] =
    useState("record-map");

  const [initialMasterRecord, setInitialMasterRecord] =
    useState(null);

  const [recordMapView, setRecordMapView] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(null);

  const serviceOptions = useMemo(() => {
    const values = new Map();

    for (const record of [...records, ...savedRecords]) {
      for (const service of record.facilities ?? []) {
        const value = String(service).trim();
        if (value) values.set(value.toLowerCase(), value);
      }
    }

    return [...values.values()].sort((left, right) =>
      left.localeCompare(right)
    );
  }, [records, savedRecords]);

  useEffect(() => {
    async function loadApplicationData() {
      try {
        const [
          rawRecords,
          saved
        ] = await Promise.all([
          fetchRecords(),
          fetchSavedRecords()
        ]);

        setRecords(rawRecords);
        setSavedRecords(saved);
      } catch (err) {
        console.error(err);

        setError(
          "Failed to load application data."
        );
      } finally {
        setLoading(false);
      }
    }

    loadApplicationData();
  }, []);

  if (loading) {
    return (
      <div className="loading">
        Loading application...
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        {error}
      </div>
    );
  }

  return (
    <>
      <header className="topbar">

        <div className="brand">

          <h1>
            Marina Manual Assigner
          </h1>

          <p>
            Marina data review and matching
          </p>

        </div>

        <nav className="navbar">

          <button
            className={`nav-button ${
              page === "inspector"
                ? "active"
                : ""
            }`}
            onClick={() =>
              {
                setInitialMasterRecord(null);
                setPage("inspector");
              }
            }
          >
            Inspector
          </button>

          <button
            className={`nav-button ${
              page === "matcher"
                ? "active"
                : ""
            }`}
            onClick={() =>
              {
                setInitialMasterRecord(null);
                setPage("matcher");
              }
            }
          >
            Matcher
          </button>

          <button
            className={`nav-button ${
              page === "record-map"
                ? "active"
                : ""
            }`}
            onClick={() => {
              setInitialMasterRecord(null);
              setPage("record-map");
            }}
          >
            Record Map
          </button>

        </nav>

      </header>

      <main className="app">

        {page === "inspector" && (
          <Inspector
            records={records}
            savedRecords={savedRecords}
            setSavedRecords={setSavedRecords}
            serviceOptions={serviceOptions}
            onCreateMaster={record => {
              setInitialMasterRecord(record);
              setPage("matcher");
            }}
          />
        )}

        {page === "matcher" && (
          <Matcher
            records={records}
            savedRecords={savedRecords}
            setSavedRecords={setSavedRecords}
            initialMasterRecord={initialMasterRecord}
            serviceOptions={serviceOptions}
          />
        )}

        {page === "record-map" && (
          <RecordMap
            records={records}
            setRecords={setRecords}
            savedRecords={savedRecords}
            setSavedRecords={setSavedRecords}
            mapView={recordMapView}
            onMapViewChange={setRecordMapView}
            serviceOptions={serviceOptions}
          />
        )}

      </main>
    </>
  );
}

export default App;
