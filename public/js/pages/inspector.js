import { state } from "../state.js";

export function renderInspector() {
  return `
    <aside class="sidebar">

      <section>

        <h2>
          Data Sources
        </h2>

        <button
          class="source-button ${
            state.selectedSource === "all"
              ? "active"
              : ""
          }"
          data-source="all"
        >
          <span>All Records</span>
          <span
            class="count"
            id="count-all"
          >
            0
          </span>
        </button>

        <button
          class="source-button ${
            state.selectedSource === "tyha"
              ? "active"
              : ""
          }"
          data-source="tyha"
        >
          <span>TYHA</span>
          <span
            class="count"
            id="count-tyha"
          >
            0
          </span>
        </button>

        <button
          class="source-button ${
            state.selectedSource === "marinas-com"
              ? "active"
              : ""
          }"
          data-source="marinas-com"
        >
          <span>Marinas.com</span>
          <span
            class="count"
            id="count-marinas-com"
          >
            0
          </span>
        </button>

        <button
          class="source-button ${
            state.selectedSource === "osm"
              ? "active"
              : ""
          }"
          data-source="osm"
        >
          <span>OSM</span>
          <span
            class="count"
            id="count-osm"
          >
            0
          </span>
        </button>

      </section>

    </aside>

    <section class="records-panel">

      <div class="records-header">

        <div>

          <h2 id="source-title">
            All Records
          </h2>

          <span id="record-count">
            0 records
          </span>

        </div>

        <input
          type="search"
          id="search"
          placeholder="Search records..."
        >

      </div>

      <div class="content">

        <div
          class="record-list"
          id="record-list"
        >
          <div class="loading">
            Loading records...
          </div>
        </div>

        <div
          class="record-detail"
          id="record-detail"
        >

          <div class="empty-state">

            <h2>
              Select a record
            </h2>

            <p>
              Select a marina from the list
              to view its details.
            </p>

          </div>

        </div>

      </div>

    </section>
  `;
}

export function initInspector() {
  const sourceButtons =
    document.querySelectorAll(".source-button");

  const recordList =
    document.getElementById("record-list");

  const recordDetail =
    document.getElementById("record-detail");

  const sourceTitle =
    document.getElementById("source-title");

  const recordCount =
    document.getElementById("record-count");

  const searchInput =
    document.getElementById("search");

  function updateCounts() {

    const counts = {
      all: state.records.length,
      tyha: 0,
      "marinas-com": 0,
      osm: 0
    };

    for (const record of state.records) {

      if (
        counts[record.source] !== undefined
      ) {
        counts[record.source]++;
      }

    }

    document.getElementById(
      "count-all"
    ).textContent = counts.all;

    document.getElementById(
      "count-tyha"
    ).textContent = counts.tyha;

    document.getElementById(
      "count-marinas-com"
    ).textContent =
      counts["marinas-com"];

    document.getElementById(
      "count-osm"
    ).textContent = counts.osm;
  }

  function getFilteredRecords() {

    const search =
      searchInput.value
        .trim()
        .toLowerCase();

    return state.records.filter(record => {

      if (
        state.selectedSource !== "all" &&
        record.source !==
          state.selectedSource
      ) {
        return false;
      }

      if (!search) {
        return true;
      }

      const name =
        record.name?.toLowerCase() ??
        "";

      const address =
        JSON.stringify(
          record.address
        ).toLowerCase();

      return (
        name.includes(search) ||
        address.includes(search)
      );
    });
  }

  function renderRecords() {

    const filtered =
      getFilteredRecords();

    sourceTitle.textContent =
      getSourceName(
        state.selectedSource
      );

    recordCount.textContent =
      `${filtered.length} records`;

    if (filtered.length === 0) {

      recordList.innerHTML = `
        <div class="empty-list">
          No records found.
        </div>
      `;

      return;
    }

    recordList.innerHTML =
  filtered
    .map(record => `
      <button
        class="record-item ${
          state.selectedRecord?.id ===
          record.id
            ? "selected"
            : ""
        }"
        data-id="${escapeHtml(record.id)}"
      >

        <strong>
          ${escapeHtml(
            record.name ||
            "Unnamed marina"
          )}
        </strong>

        <span class="record-source">
          ${escapeHtml(
            getSourceName(
              record.source
            )
          )}
        </span>

        <span>
          ${escapeHtml(
            formatLocation(record)
          )}
        </span>

      </button>
    `)
    .join("");

    document
      .querySelectorAll(".record-item")
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            const record =
              state.records.find(
                item =>
                  item.id ===
                  button.dataset.id
              );

            if (!record) {
              return;
            }

            state.selectedRecord =
              record;

            renderRecords();

            renderRecordDetail(
              record
            );
          }
        );
      });
  }

  function renderRecordDetail(record) {

    recordDetail.innerHTML = `

      <div class="detail-header">

        <div>

          <span class="source-label">
            ${escapeHtml(
              getSourceName(
                record.source
              )
            )}
          </span>

          <h2>
            ${escapeHtml(
              record.name ||
              "Unnamed marina"
            )}
          </h2>

        </div>

      </div>

      <div class="detail-grid">

        ${detailField(
          "ID",
          record.id
        )}

        ${detailField(
          "Source",
          record.source
        )}

        ${detailField(
          "Source File",
          record.sourceFile
        )}

        ${detailField(
          "Description",
          record.description
        )}

        ${detailField(
          "Location",
          formatCoordinates(
            record.latitude,
            record.longitude
          )
        )}

        ${detailField(
          "Address",
          formatAddress(
            record.address
          )
        )}

        ${detailField(
          "Phone",
          record.phone
        )}

        ${detailField(
          "Email",
          record.email
        )}

        ${detailField(
          "Website",
          record.website
        )}

        ${detailField(
          "Berths",
          record.berths
        )}

        ${detailField(
          "Facilities",
          formatJsonValue(
            record.facilities
          )
        )}

        ${detailField(
          "Images",
          formatJsonValue(
            record.images
          )
        )}

        ${detailField(
          "Source URL",
          record.sourceUrl
            ? `<a
                href="${escapeHtml(
                  record.sourceUrl
                )}"
                target="_blank"
                rel="noopener noreferrer"
              >
                ${escapeHtml(
                  record.sourceUrl
                )}
              </a>`
            : null,
          true
        )}

      </div>

      <div class="raw-section">

        <div class="raw-section-header">

          <h3>
            Complete Record
          </h3>

          <span class="raw-description">
            Normalized record including
            original source data
          </span>

        </div>

        <pre>${escapeHtml(
          JSON.stringify(
            record,
            null,
            2
          )
        )}</pre>

      </div>
    `;
  }

  function detailField(
    label,
    value,
    html = false
  ) {

    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {

      return `
        <div class="detail-field">

          <label>
            ${escapeHtml(label)}
          </label>

          <div class="muted">
            Not available
          </div>

        </div>
      `;
    }

    return `
      <div class="detail-field">

        <label>
          ${escapeHtml(label)}
        </label>

        <div>
          ${
            html
              ? value
              : escapeHtml(
                  String(value)
                )
          }
        </div>

      </div>
    `;
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
      formatAddress(
        record.address
      );

    if (address) {
      return address;
    }

    if (
      record.latitude !== null &&
      record.longitude !== null
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
      "marinas-com":
        "Marinas.com",
      osm:
        "OpenStreetMap"
    };

    return (
      names[source] ??
      source
    );
  }

  function escapeHtml(value) {

    return String(value)
      .replaceAll(
        "&",
        "&amp;"
      )
      .replaceAll(
        "<",
        "&lt;"
      )
      .replaceAll(
        ">",
        "&gt;"
      )
      .replaceAll(
        '"',
        "&quot;"
      )
      .replaceAll(
        "'",
        "&#039;"
      );
  }

  sourceButtons.forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          state.selectedSource =
            button.dataset.source;

          state.selectedRecord =
            null;

          sourceButtons.forEach(
            item => {
              item.classList.remove(
                "active"
              );
            }
          );

          button.classList.add(
            "active"
          );

          recordDetail.innerHTML = `
            <div class="empty-state">

              <h2>
                Select a record
              </h2>

              <p>
                Select a marina from
                the list to view
                its details.
              </p>

            </div>
          `;

          renderRecords();
        }
      );

    }
  );

  searchInput.addEventListener(
    "input",
    () => {
      renderRecords();
    }
  );

  updateCounts();
  renderRecords();
}