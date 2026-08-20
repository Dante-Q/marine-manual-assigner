import { useMemo, useState } from "react";

import {
  saveMatch
} from "../api/api.js";

import RecordSearch
  from "../components/matcher/RecordSearch.jsx";

import MasterRecord
  from "../components/matcher/MasterRecord.jsx";

import SourceRecord
  from "../components/matcher/SourceRecord.jsx";

function Matcher({
  records,
  savedRecords,
  setSavedRecords,
  initialMasterRecord
}) {
  const [masterRecord, setMasterRecord] =
    useState(
      initialMasterRecord
        ? { ...initialMasterRecord }
        : null
    );

  const [sourceRecords, setSourceRecords] =
    useState([]);

  const [addingRecord, setAddingRecord] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [showMatchedRecords, setShowMatchedRecords] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState(null);

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

  const searchResults = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    if (!query) {
      return [];
    }

    return records.filter(record => {
      /*
       * The master record and all source records
       * already belonging to this match cannot
       * be added again.
       */
      if (
        masterRecord &&
        record.id === masterRecord.id
      ) {
        return false;
      }

      const alreadyAdded =
        sourceRecords.some(
          sourceRecord =>
            sourceRecord.id === record.id
        );

      if (alreadyAdded) {
        return false;
      }

      if (
        !showMatchedRecords &&
        matchedRecordIds.has(record.id)
      ) {
        return false;
      }

      const name =
        record.name?.toLowerCase() ?? "";

      const address =
        JSON.stringify(
          record.address
        ).toLowerCase();

      const source =
        record.source?.toLowerCase() ?? "";

      const id =
        record.id?.toLowerCase() ?? "";

      return (
        name.includes(query) ||
        address.includes(query) ||
        source.includes(query) ||
        id.includes(query)
      );
    });
  }, [
    records,
    masterRecord,
    sourceRecords,
    search,
    showMatchedRecords,
    matchedRecordIds
  ]);

  /*
   * Start a completely new match.
   *
   * We don't create a master record here.
   * The first source record selected becomes
   * the master.
   */
  function openAddRecord() {
    setAddingRecord(true);
    setSearch("");
    setError(null);
  }

  function closeAddRecord() {
    setAddingRecord(false);
    setSearch("");
  }

  /*
   * Add a source record.
   *
   * The FIRST record becomes the editable master.
   * Every subsequent record becomes a read-only
   * source record.
   *
   * We copy the record so that editing the master
   * can never mutate the raw record in memory.
   */
  function addRecord(record) {
    setError(null);

    if (!masterRecord) {
      setMasterRecord({
        ...record
      });

      setAddingRecord(false);
      setSearch("");

      return;
    }

    const alreadyAdded =
      sourceRecords.some(
        existing =>
          existing.id === record.id
      );

    if (alreadyAdded) {
      return;
    }

    setSourceRecords(current => [
      ...current,
      {
        ...record
      }
    ]);

    setSearch("");
  }

  /*
   * Update a field on the editable master.
   */
  function updateMasterRecord(
    field,
    value
  ) {
    setMasterRecord(current => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        [field]: value
      };
    });
  }

  /*
   * Remove an additional source record.
   *
   * The master cannot be removed from here.
   */
  function removeSourceRecord(recordId) {
    setSourceRecords(current =>
      current.filter(
        record =>
          record.id !== recordId
      )
    );
  }

  /*
   * Save the master record and its source
   * record references.
   *
   * The backend is responsible for:
   *
   *   - generating MARINA-xxxxx
   *   - writing to data/saved
   *   - never touching data/raw
   */
async function handleSave() {
  if (!masterRecord) {
    return;
  }

  setSaving(true);
  setError(null);

  try {
    const payload = {
      masterRecord,
      sourceRecords
    };

    const savedRecord =
      await saveMatch(payload);

    setSavedRecords(current => [
      ...current,
      savedRecord
    ]);

    resetMatcher();

  } catch (err) {
    console.error(err);

    setError(
      err.message ||
      "Failed to save record."
    );
  } finally {
    setSaving(false);
  }
}

  function resetMatcher() {
    setMasterRecord(null);
    setSourceRecords([]);
    setAddingRecord(false);
    setSearch("");
  }

  /*
   * No master record yet.
   *
   * This is the starting screen where the user
   * selects the first source record.
   */
  if (!masterRecord) {
    return (
      <div className="matcher-page">

        <div className="matcher-header">

          <div>
            <h2>
              Manual Matcher
            </h2>

            <p>
              Select the first source record to
              create a new master record.
            </p>
          </div>

        </div>

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        {!addingRecord ? (
          <div className="matcher-empty">

            <h2>
              No master record selected
            </h2>

            <p>
              The first record you add becomes
              the editable master record.
            </p>

            <button
              className="primary-button"
              onClick={openAddRecord}
            >
              Add First Record
            </button>

          </div>
        ) : (
          <RecordSearch
            search={search}
            setSearch={setSearch}
            results={searchResults}
            showMatchedRecords={showMatchedRecords}
            setShowMatchedRecords={setShowMatchedRecords}
            isMatched={record =>
              matchedRecordIds.has(record.id)
            }
            onAdd={addRecord}
            onClose={closeAddRecord}
          />
        )}

      </div>
    );
  }

  /*
   * A master record now exists.
   *
   * Display it at the top and the additional
   * source records underneath.
   */
  return (
    <div className="matcher-page">

      <div className="matcher-header">

        <div>
          <h2>
            Manual Matcher
          </h2>

          <p>
            Edit the master record and compare
            it against the source records.
          </p>
        </div>

        <div className="matcher-header-actions">

          <button
            className="secondary-button"
            onClick={resetMatcher}
            disabled={saving}
          >
            Start Over
          </button>

        </div>

      </div>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      <MasterRecord
        record={masterRecord}
        onChange={updateMasterRecord}
        onSave={handleSave}
        saving={saving}
        locationEditable
      />

      <section className="source-records-section">

        <div className="source-records-header">

          <div>
            <h2>
              Source Records
            </h2>

            <p>
              Additional source records associated
              with this master record.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={openAddRecord}
            disabled={saving}
          >
            Add Source Record
          </button>

        </div>

        {addingRecord && (
          <RecordSearch
            search={search}
            setSearch={setSearch}
            results={searchResults}
            showMatchedRecords={showMatchedRecords}
            setShowMatchedRecords={setShowMatchedRecords}
            isMatched={record =>
              matchedRecordIds.has(record.id)
            }
            onAdd={addRecord}
            onClose={closeAddRecord}
          />
        )}

        {sourceRecords.length === 0 ? (
          <div className="matcher-empty">

            <h3>
              No additional source records
            </h3>

            <p>
              Add another record to compare
              information from a different source.
            </p>

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

      <div className="matcher-save-bar">

        <div>
          <strong>
            {sourceRecords.length + 1}
          </strong>

          <span>
            {" "}source record
            {sourceRecords.length !== 0
              ? "s"
              : ""}
            {" "}in this match
          </span>
        </div>

        <button
          className="primary-button"
          onClick={handleSave}
          disabled={saving}
        >
          {saving
            ? "Saving..."
            : "Save Record"}
        </button>

      </div>

    </div>
  );
}

export default Matcher;
