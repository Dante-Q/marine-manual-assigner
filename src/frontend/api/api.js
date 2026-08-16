export async function fetchRecords() {
  const response = await fetch("/api/records");

  if (!response.ok) {
    throw new Error(
      `Failed to fetch records: ${response.status}`
    );
  }

  const data = await response.json();

  return data.records;
}