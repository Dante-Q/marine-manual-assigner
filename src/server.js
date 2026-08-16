import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { loadRecords } from "./records.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    app: "marina-manual-assigner"
  });
});

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

app.listen(PORT, () => {
  console.log(`Marina Manual Assigner running at http://localhost:${PORT}`);
});