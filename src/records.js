import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "../data/raw");

function readJsonFiles(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs
    .readdirSync(directory)
    .filter(file => file.endsWith(".json"))
    .map(file => {
      const filePath = path.join(directory, file);

      try {
        const data = JSON.parse(
          fs.readFileSync(filePath, "utf8")
        );

        return {
          file,
          filePath,
          data
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

export function loadRecords() {
  const records = [];

  // ------------------------------------------------------------
  // TYHA
  // ------------------------------------------------------------

  const tyhaDir = path.join(
    DATA_DIR,
    "tyha",
    "marinas"
  );

  for (const record of readJsonFiles(tyhaDir)) {
    const data = record.data;

    records.push({
      id: `tyha:${data.identity?.id ?? record.file}`,

      source: "tyha",

      sourceFile: record.file,

      name:
        data.identity?.name ??
        null,

      description:
        data.overview?.description ??
        null,

      latitude:
        data.location?.latitude ??
        data.discovery?.latitude ??
        null,

      longitude:
        data.location?.longitude ??
        data.discovery?.longitude ??
        null,

      address:
        data.address ??
        [],

      phone:
        data.contact?.phone ??
        null,

      email:
        data.contact?.email ??
        null,

      website:
        data.contact?.website ??
        null,

      berths:
        data.overview?.berths ??
        null,

      facilities:
        data.facilities ??
        [],

      images:
        data.images ??
        [],

      sourceUrl:
        data.source?.url ??
        null,

      raw: data
    });
  }

  // ------------------------------------------------------------
  // Marinas.com
  // ------------------------------------------------------------

  const marinasComDir = path.join(
    DATA_DIR,
    "marinas-com"
  );

  for (const record of readJsonFiles(marinasComDir)) {
    const data = record.data;
    const marina = data.marina;

    if (!marina) {
      continue;
    }

    records.push({
      id:
        `marinas-com:${
          marina.sourceRecord?.marinasComId ??
          record.file
        }`,

      source: "marinas-com",

      sourceFile: record.file,

      name:
        marina.name ??
        null,

      description:
        marina.description ??
        null,

      latitude:
        marina.coordinates?.latitude ??
        null,

      longitude:
        marina.coordinates?.longitude ??
        null,

      address:
        marina.address ??
        {},

      phone:
        marina.contact?.phone ??
        null,

      email:
        marina.contact?.email ??
        null,

      website:
        marina.contact?.website ??
        null,

      berths:
        marina.berthCapacity ??
        null,

      facilities: [],

      images:
        marina.images ??
        [],

      sourceUrl:
        marina.sourceUrl ??
        data.source?.url ??
        null,

      raw: data
    });
  }

  // ------------------------------------------------------------
  // SailingWorldMap / OSM
  //
  // Only load uk-marinas2.json.
  // uk-marinas-old.json is intentionally ignored.
  //
  // File structure:
  //
  // {
  //   "source": {...},
  //   "data": {
  //     "version": 0.6,
  //     "elements": [...]
  //   }
  // }
  // ------------------------------------------------------------

  const osmFile = path.join(
    DATA_DIR,
    "sailingworldmap",
    "uk-marinas2.json"
  );

  if (fs.existsSync(osmFile)) {
    try {
      const data = JSON.parse(
        fs.readFileSync(osmFile, "utf8")
      );

      const elements =
        data?.data?.elements ??
        [];

      for (const element of elements) {
        const tags = element.tags ?? {};

        records.push({
          id:
            `osm:${element.type}:${element.id}`,

          source: "osm",

          sourceFile: "uk-marinas2.json",

          name:
            tags.name ??
            null,

          description: null,

          latitude:
            element.lat ??
            element.center?.lat ??
            null,

          longitude:
            element.lon ??
            element.center?.lon ??
            null,

          address: {
            street:
              tags["addr:street"] ??
              null,

            city:
              tags["addr:city"] ??
              null,

            postcode:
              tags["addr:postcode"] ??
              null,

            country:
              tags["addr:country"] ??
              null
          },

          phone:
            tags.phone ??
            tags["contact:phone"] ??
            null,

          email:
            tags.email ??
            tags["contact:email"] ??
            null,

          website:
            tags.website ??
            tags["contact:website"] ??
            null,

          berths: null,

          facilities: [],

          images:
            tags.image
              ? [tags.image]
              : [],

          sourceUrl: null,

          raw: element
        });
      }
    } catch (error) {
      console.error(
        `Failed to read ${osmFile}:`,
        error.message
      );
    }
  }

  return records;
}

export function updateRawRecord(id, updates) {
  const record = findRawRecord(id);

  if (record.source === "osm") {
    return updateOsmRecord(record, updates);
  }

  const filePath = getRawFilePath(record);
  const data = readJsonFile(filePath);

  if (record.source === "tyha") {
    updateTyhaRecord(data, updates);
  } else if (record.source === "marinas-com") {
    updateMarinasComRecord(data, updates);
  } else {
    throw new Error(`Unsupported raw source: ${record.source}`);
  }

  writeJsonFile(filePath, data);
  return findRawRecord(id);
}

export function deleteRawRecord(id) {
  const record = findRawRecord(id);

  if (record.source === "osm") {
    const filePath = getRawFilePath(record);
    const data = readJsonFile(filePath);
    const elements = data?.data?.elements ?? [];
    const index = elements.findIndex(element =>
      `osm:${element.type}:${element.id}` === id
    );

    if (index === -1) {
      throw new Error("Raw OSM record not found");
    }

    elements.splice(index, 1);
    writeJsonFile(filePath, data);
  } else {
    fs.unlinkSync(getRawFilePath(record));
  }

  return true;
}

function findRawRecord(id) {
  const record = loadRecords().find(item => item.id === id);

  if (!record) {
    throw new Error("Raw record not found");
  }

  return record;
}

function getRawFilePath(record) {
  if (record.source === "tyha") {
    return path.join(DATA_DIR, "tyha", "marinas", record.sourceFile);
  }

  if (record.source === "marinas-com") {
    return path.join(DATA_DIR, "marinas-com", record.sourceFile);
  }

  if (record.source === "osm") {
    return path.join(
      DATA_DIR,
      "sailingworldmap",
      "uk-marinas2.json"
    );
  }

  throw new Error(`Unsupported raw source: ${record.source}`);
}

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJsonFile(filePath, data) {
  fs.writeFileSync(
    filePath,
    JSON.stringify(data, null, 2) + "\n",
    "utf8"
  );
}

function updateTyhaRecord(data, updates) {
  data.identity ??= {};
  data.overview ??= {};
  data.location ??= {};
  data.contact ??= {};

  data.identity.name = updates.name ?? null;
  data.overview.description = updates.description ?? null;
  data.overview.berths = updates.berths ?? null;
  data.location.latitude = toNumberOrNull(updates.latitude);
  data.location.longitude = toNumberOrNull(updates.longitude);
  data.address = updates.address ?? [];
  data.contact.phone = updates.phone ?? null;
  data.contact.email = updates.email ?? null;
  data.contact.website = updates.website ?? null;
  data.facilities = Array.isArray(updates.facilities)
    ? updates.facilities
    : [];
}

function updateMarinasComRecord(data, updates) {
  if (!data.marina) {
    throw new Error("Invalid Marinas.com raw record");
  }

  const marina = data.marina;
  marina.coordinates ??= {};
  marina.contact ??= {};

  marina.name = updates.name ?? null;
  marina.description = updates.description ?? null;
  marina.berthCapacity = updates.berths ?? null;
  marina.coordinates.latitude = toNumberOrNull(updates.latitude);
  marina.coordinates.longitude = toNumberOrNull(updates.longitude);
  marina.address = updates.address ?? {};
  marina.contact.phone = updates.phone ?? null;
  marina.contact.email = updates.email ?? null;
  marina.contact.website = updates.website ?? null;
  marina.facilities = Array.isArray(updates.facilities)
    ? updates.facilities
    : [];
}

function updateOsmRecord(record, updates) {
  const filePath = getRawFilePath(record);
  const data = readJsonFile(filePath);
  const element = data?.data?.elements?.find(item =>
    `osm:${item.type}:${item.id}` === record.id
  );

  if (!element) {
    throw new Error("Raw OSM record not found");
  }

  element.tags ??= {};
  element.tags.name = updates.name ?? null;
  element.tags.phone = updates.phone ?? null;
  element.tags.email = updates.email ?? null;
  element.tags.website = updates.website ?? null;
  element.tags.facilities = Array.isArray(updates.facilities)
    ? updates.facilities.join(";")
    : "";
  element.lat = toNumberOrNull(updates.latitude);
  element.lon = toNumberOrNull(updates.longitude);

  writeJsonFile(filePath, data);
  return findRawRecord(record.id);
}

function toNumberOrNull(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
export function loadSavedRecords() {
  const savedDir = path.join(
    __dirname,
    "../data/saved"
  );

  if (!fs.existsSync(savedDir)) {
    return [];
  }

  return fs
    .readdirSync(savedDir)
    .filter(file =>
      /^MARINA-\d{5}\.json$/i.test(file)
    )
    .map(file => {
      const filePath = path.join(
        savedDir,
        file
      );

      try {
        return JSON.parse(
          fs.readFileSync(
            filePath,
            "utf8"
          )
        );
      } catch (error) {
        console.error(
          `Failed to read saved record ${filePath}:`,
          error.message
        );

        return null;
      }
    })
    .filter(Boolean);
}
