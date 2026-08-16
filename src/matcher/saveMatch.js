import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SAVED_DIR = path.join(
  __dirname,
  "../../data/saved"
);

export function saveMatch(match) {
  if (!match) {
    throw new Error(
      "Cannot save an empty match"
    );
  }

  if (!match.id) {
    throw new Error(
      "Cannot save a match without an ID"
    );
  }

  if (!/^MARINA-\d{5}$/.test(match.id)) {
    throw new Error(
      `Invalid master record ID: ${match.id}`
    );
  }

  fs.mkdirSync(
    SAVED_DIR,
    {
      recursive: true
    }
  );

  const filePath = path.join(
    SAVED_DIR,
    `${match.id}.json`
  );

  const record = {
    ...match,
    updatedAt:
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