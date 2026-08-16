import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SAVED_DIR = path.join(
  __dirname,
  "../../data/saved"
);

export function generateMasterId() {
  if (!fs.existsSync(SAVED_DIR)) {
    return "MARINA-00001";
  }

  const files = fs
    .readdirSync(SAVED_DIR)
    .filter(file =>
      /^MARINA-\d{5}\.json$/i.test(file)
    );

  if (files.length === 0) {
    return "MARINA-00001";
  }

  const numbers = files.map(file => {
    const match =
      file.match(/^MARINA-(\d{5})\.json$/i);

    return match
      ? Number(match[1])
      : 0;
  });

  const highest =
    Math.max(...numbers);

  return `MARINA-${String(
    highest + 1
  ).padStart(5, "0")}`;
}