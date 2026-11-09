export async function extractPdf(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/extract", { method: "POST", body: formData });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}
