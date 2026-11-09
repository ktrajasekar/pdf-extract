import { useState, useRef } from "react";
import { extractPdf } from "./api";

const LABELS = {
  invoiceNumber: "Invoice number",
  date: "Date",
  total: "Total",
  email: "Email",
  phone: "Phone",
  gstin: "GSTIN",
};

export default function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("fields");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const pick = (f) => {
    if (!f) return;
    if (f.type !== "application/pdf") {
      setError("That file isn't a PDF. Choose a file ending in .pdf.");
      return;
    }
    setError("");
    setResult(null);
    setFile(f);
  };

  const run = async () => {
    setLoading(true);
    setError("");
    try {
      setResult(await extractPdf(file));
      setTab("fields");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = file.name.replace(/\.pdf$/i, "") + ".json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <main className="page">
      <header className="head">
        <h1>Pull the data out of a PDF</h1>
        <p>Upload a PDF to get its text, key fields and table rows as JSON.</p>
      </header>

      <section
        className={`drop ${dragging ? "is-over" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files[0]); }}
      >
        <input ref={inputRef} type="file" accept="application/pdf" hidden onChange={(e) => pick(e.target.files[0])} />
        {file ? (
          <p className="file-name">{file.name} <span>({(file.size / 1024).toFixed(0)} KB)</span></p>
        ) : (
          <p>Drop a PDF here, or choose one from your computer.</p>
        )}
        <div className="actions">
          <button className="ghost" onClick={() => inputRef.current.click()}>
            {file ? "Choose another" : "Choose PDF"}
          </button>
          {file && (
            <button className="primary" onClick={run} disabled={loading}>
              {loading ? "Extracting…" : "Extract data"}
            </button>
          )}
        </div>
      </section>

      {error && <p className="error" role="alert">{error}</p>}

      {result && (
        <section className="result">
          <div className="result-head">
            <p><strong>{result.fileName}</strong>, {result.pages} {result.pages === 1 ? "page" : "pages"}</p>
            <button className="ghost" onClick={download}>Download JSON</button>
          </div>

          {result.isLikelyScanned && (
            <p className="warn">This PDF has almost no text layer, so it's probably scanned. Use OCR to read it.</p>
          )}

          <nav className="tabs" role="tablist">
            {[["fields", "Fields"], ["rows", `Rows (${result.rows.length})`], ["text", "Full text"]].map(([k, l]) => (
              <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>
                {l}
              </button>
            ))}
          </nav>

          {tab === "fields" && (
            <dl className="fields">
              {Object.entries(result.fields).map(([k, v]) => (
                <div key={k}>
                  <dt>{LABELS[k] || k}</dt>
                  <dd className={v ? "hit" : "miss"}>{v || "Not found"}</dd>
                </div>
              ))}
            </dl>
          )}

          {tab === "rows" && (
            <div className="table-wrap">
              <table>
                <tbody>
                  {result.rows.map((r, i) => (
                    <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "text" && <pre className="text">{result.text}</pre>}
        </section>
      )}
    </main>
  );
}
