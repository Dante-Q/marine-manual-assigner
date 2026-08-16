import { useEffect, useState } from "react";

import {
  fetchRecords,
  fetchSavedRecords
} from "./api/api.js";

import Inspector from "./pages/Inspector.jsx";
import Matcher from "./pages/Matcher.jsx";

function App() {
  const [records, setRecords] = useState([]);
  const [savedRecords, setSavedRecords] =
    useState([]);

  const [page, setPage] =
    useState("inspector");

  const [initialMasterRecord, setInitialMasterRecord] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(null);

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

        </nav>

      </header>

      <main className="app">

        {page === "inspector" && (
          <Inspector
            records={records}
            savedRecords={savedRecords}
            setSavedRecords={setSavedRecords}
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
          />
        )}

      </main>
    </>
  );
}

export default App;
