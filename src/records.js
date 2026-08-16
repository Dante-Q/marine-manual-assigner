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