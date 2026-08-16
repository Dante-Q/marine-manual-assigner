export async function fetchRecords() {
  const response = await fetch("/api/records");

  if (!response.ok) {
    throw new Error("Failed to load records");
  }

  const data = await response.json();

  return data.records;
}