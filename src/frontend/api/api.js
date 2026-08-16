export async function fetchRecords() {
  const response =
    await fetch("/api/records");

  if (!response.ok) {
    throw new Error(
      `Failed to fetch records: ${response.status}`
    );
  }

  const data =
    await response.json();

  return data.records;
}

export async function fetchSavedRecords() {
  const response =
    await fetch("/api/saved-records");

  if (!response.ok) {
    throw new Error(
      `Failed to fetch saved records: ${response.status}`
    );
  }

  const data =
    await response.json();

  return data.records;
}

export async function createMatch(
  sourceRecord
) {
  const response =
    await fetch("/api/matches", {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json"
      },

      body: JSON.stringify(
        sourceRecord
      )
    });

  if (!response.ok) {
    const data =
      await response.json();

    throw new Error(
      data.error ||
      `Failed to create match: ${response.status}`
    );
  }

  return response.json();
}

export async function updateMatch(
  id,
  record
) {
  const response =
    await fetch(
      `/api/matches/${encodeURIComponent(id)}`,
      {
        method: "PUT",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify(
          record
        )
      }
    );

  if (!response.ok) {
    const data =
      await response.json();

    throw new Error(
      data.error ||
      `Failed to update match: ${response.status}`
    );
  }

  return response.json();
}

export async function saveMatch(records) {
  const response =
    await fetch("/api/matches", {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json"
      },

      body: JSON.stringify(records)
    });

  if (!response.ok) {
    const data =
      await response.json();

    throw new Error(
      data.error ||
      `Failed to save record: ${response.status}`
    );
  }

  return response.json();
}