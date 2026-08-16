export function getMatchedRecordIds(
  savedRecords
) {
  const matchedIds = new Set();

  if (!Array.isArray(savedRecords)) {
    return matchedIds;
  }

  for (const savedRecord of savedRecords) {
    if (
      !Array.isArray(
        savedRecord.sourceRecords
      )
    ) {
      continue;
    }

    for (const sourceRecord of
      savedRecord.sourceRecords) {
      if (sourceRecord?.id) {
        matchedIds.add(
          sourceRecord.id
        );
      }
    }
  }

  return matchedIds;
}

export function isRecordMatched(
  recordId,
  savedRecords
) {
  if (!recordId) {
    return false;
  }

  return getMatchedRecordIds(
    savedRecords
  ).has(recordId);
}