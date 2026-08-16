import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SAVED_DIR = path.join(
  __dirname,
  "../data/saved"
);

function ensureSavedDirectory() {
  if (!fs.existsSync(SAVED_DIR)) {
    fs.mkdirSync(SAVED_DIR, {
      recursive: true
    });
  }
}

function readJsonFiles(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs
    .readdirSync(directory)
    .filter(file => file.endsWith(".json"))
    .map(file => {
      const filePath = path.join(
        directory,
        file
      );

      try {
        return {
          file,
          filePath,
          data: JSON.parse(
            fs.readFileSync(
              filePath,
              "utf8"
            )
          )
        };
      } catch (error) {
        console.error(
          `Failed to read ${filePath}:`,
          error.message
        );

        return null;
      }
    })
    .filter(Boolean);
}

export function loadSavedRecords() {
  ensureSavedDirectory();

  return readJsonFiles(SAVED_DIR).map(
    record => record.data
  );
}

export function getSavedRecord(id) {
  ensureSavedDirectory();

  const filePath = path.join(
    SAVED_DIR,
    `${id}.json`
  );

  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    return JSON.parse(
      fs.readFileSync(
        filePath,
        "utf8"
      )
    );
  } catch (error) {
    console.error(
      `Failed to read saved record ${id}:`,
      error.message
    );

    return null;
  }
}

export function saveSavedRecord(record) {
  ensureSavedDirectory();

  if (!record?.id) {
    throw new Error(
      "Cannot save record without an id"
    );
  }

  const filePath = path.join(
    SAVED_DIR,
    `${record.id}.json`
  );

  fs.writeFileSync(
    filePath,
    JSON.stringify(
      record,
      null,
      2
    ),
    "utf8"
  );

  return record;
}

export function deleteSavedRecord(id) {
  ensureSavedDirectory();

  const filePath = path.join(
    SAVED_DIR,
    `${id}.json`
  );

  if (!fs.existsSync(filePath)) {
    return false;
  }

  fs.unlinkSync(filePath);

  return true;
}