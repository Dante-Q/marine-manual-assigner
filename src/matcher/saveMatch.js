import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { generateMasterId } from "./generateId.js";

const __filename =
  fileURLToPath(import.meta.url);

const __dirname =
  path.dirname(__filename);

const SAVED_DIR =
  path.join(
    __dirname,
    "../../data/saved"
  );

export function saveMatch(match) {
  if (!match) {
    throw new Error(
      "Cannot save an empty match"
    );
  }

  fs.mkdirSync(
    SAVED_DIR,
    {
      recursive: true
    }
  );

  const id =
    match.id ||
    generateMasterId();

  if (!/^MARINA-\d{5}$/.test(id)) {
    throw new Error(
      `Invalid master record ID: ${id}`
    );
  }

  const filePath =
    path.join(
      SAVED_DIR,
      `${id}.json`
    );

  const record = {
    ...match,

    id,

    updatedAt:
      new Date().toISOString(),

    createdAt:
      match.createdAt ??
      new Date().toISOString()
  };

  fs.writeFileSync(
    filePath,
    JSON.stringify(
      record,
      null,
      2
    ) + "\n",
    "utf8"
  );

  return record;
}