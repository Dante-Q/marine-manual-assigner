import { useEffect, useState } from "react";
import { fetchRecords } from "./api/api.js";
import Inspector from "./pages/Inspector.jsx";
import Matcher from "./pages/Matcher.jsx";

function App() {
  const [records, setRecords] = useState([]);
  const [matchedRecords, setMatchedRecords] = useState([]);
  const [page, setPage] = useState("inspector");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadRecords() {
      try {
        const data = await fetchRecords();

        setRecords(data);
      } catch (err) {
        console.error(err);

        setError(
          "Failed to load application data."
        );
      } finally {
        setLoading(false);
      }
    }

    loadRecords();
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
              setPage("inspector")
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
              setPage("matcher")
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
            matchedRecords={matchedRecords}
            setMatchedRecords={setMatchedRecords}
          />
        )}

        {page === "matcher" && (
          <Matcher
            records={records}
            matchedRecords={matchedRecords}
            setMatchedRecords={setMatchedRecords}
          />
        )}

      </main>
    </>
  );
}

export default App;