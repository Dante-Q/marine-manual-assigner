import { generateMasterId } from "./generateId.js";

export function createMatch(records) {
  if (!Array.isArray(records)) {
    throw new Error(
      "createMatch expects an array of records"
    );
  }

  if (records.length === 0) {
    throw new Error(
      "Cannot create a match without records"
    );
  }

  const primaryRecord = records[0];

  return {
    id: generateMasterId(),

    name:
      primaryRecord.name ??
      null,

    description:
      primaryRecord.description ??
      null,

    latitude:
      primaryRecord.latitude ??
      null,

    longitude:
      primaryRecord.longitude ??
      null,

    address:
      primaryRecord.address ??
      null,

    phone:
      primaryRecord.phone ??
      null,

    email:
      primaryRecord.email ??
      null,

    website:
      primaryRecord.website ??
      null,

    berths:
      primaryRecord.berths ??
      null,

    facilities:
      primaryRecord.facilities ??
      [],

    images:
      primaryRecord.images ??
      [],

    sourceRecords: records.map(record => ({
      id: record.id,
      source: record.source
    })),

    createdAt:
      new Date().toISOString(),

    updatedAt:
      new Date().toISOString()
  };
}