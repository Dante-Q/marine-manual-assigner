import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import { loadRecords } from "./records.js";

import {
  loadSavedRecords,
  getSavedRecord
} from "./savedRecords.js";

import { createMatch } from "./matcher/createMatch.js";
import { saveMatch } from "./matcher/saveMatch.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

app.use(
  express.static(
    path.join(__dirname, "../public")
  )
);

// ------------------------------------------------------------
// HEALTH
// ------------------------------------------------------------

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    app: "marina-manual-assigner"
  });
});

// ------------------------------------------------------------
// RAW RECORDS
// ------------------------------------------------------------

app.get("/api/records", (req, res) => {
  try {
    const records = loadRecords();

    res.json({
      total: records.length,
      records
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to load records"
    });
  }
});

// ------------------------------------------------------------
// SAVED MASTER RECORDS
// ------------------------------------------------------------

app.get("/api/saved-records", (req, res) => {
  try {
    const records =
      loadSavedRecords();

    res.json({
      total: records.length,
      records
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error:
        "Failed to load saved records"
    });
  }
});

// ------------------------------------------------------------
// GET ONE SAVED MASTER RECORD
// ------------------------------------------------------------

app.get(
  "/api/saved-records/:id",
  (req, res) => {
    try {
      const record =
        getSavedRecord(
          req.params.id
        );

      if (!record) {
        return res.status(404).json({
          error:
            "Saved record not found"
        });
      }

      res.json(record);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error:
          "Failed to load saved record"
      });
    }
  }
);

// ------------------------------------------------------------
// CREATE MASTER RECORD
// ------------------------------------------------------------

app.post("/api/matches", (req, res) => {
  try {
    const record =
      createMatch(req.body);

    const saved =
      saveMatch(record);

    res.status(201).json(saved);
  } catch (error) {
    console.error(error);

    res.status(400).json({
      error: error.message
    });
  }
});

// ------------------------------------------------------------
// UPDATE MASTER RECORD
// ------------------------------------------------------------

app.put(
  "/api/matches/:id",
  (req, res) => {
    try {
      const record = {
        ...req.body,
        id: req.params.id
      };

      const saved =
        saveMatch(record);

      res.json(saved);
    } catch (error) {
      console.error(error);

      res.status(400).json({
        error: error.message
      });
    }
  }
);

// ------------------------------------------------------------
// START SERVER
// ------------------------------------------------------------

app.listen(PORT, () => {
  console.log(
    `Marina Manual Assigner running at http://localhost:${PORT}`
  );
});

export default app;