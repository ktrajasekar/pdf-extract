# pdf-extract

Upload a PDF in a React client, extract text, structured fields and table-like rows in an Express server.

## Run

```bash
# Terminal 1
cd server
npm install
npm run dev        # http://localhost:5000

# Terminal 2
cd client
npm install
npm run dev        # http://localhost:5173

```

## Folder structure

```
pdf-extract/
├── client/                 React + Vite
│   ├── index.html
│   ├── vite.config.js      proxies /api → :5000
│   └── src/
│       ├── main.jsx
│       ├── App.jsx         upload UI, result tabs
│       ├── api.js          extractPdf()
│       └── styles.css
└── server/                 Node.js + Express
    ├── .env                PORT, CLIENT_ORIGIN, MAX_FILE_MB
    └── src/
        ├── index.js        app setup
        ├── routes/extract.js
        ├── middleware/
        │   ├── upload.js       multer config
        │   └── errorHandler.js
        └── extractors/
            ├── text.js     pdf-parse
            ├── rows.js     pdfjs-dist
            └── fields.js   regex fields
```

The Vite dev server proxies `/api` to the Express server, so no CORS setup is needed in development.

## API

`POST /api/extract` (multipart/form-data, field name `file`, PDF only, max 10 MB)

Response:

```json
{
  "fileName": "invoice.pdf",
  "pages": 2,
  "info": { "Title": "..." },
  "fields": {
    "invoiceNumber": "INV-001",
    "date": "01/02/2026",
    "total": "1,250.00",
    "email": "a@b.com",
    "phone": "..."
  },
  "rows": [
    ["Item", "Qty", "Price"],
    ["Widget", "2", "10.00"]
  ],
  "text": "full text...",
  "isLikelyScanned": false
}
```

`GET /api/health` returns `{ "status": "ok" }`.

## Customising

Edit `server/src/extractors/fields.js` to add regex patterns for your documents.
If `isLikelyScanned` is true, the PDF is probably an image and needs OCR (e.g. tesseract.js).

# pdf-extract: Architecture

```mermaid
flowchart LR
    U([User]) -->|drag & drop PDF| UI

    subgraph Client["Client: React + Vite :5173"]
        UI[App.jsx<br/>Upload UI, Tabs, Download JSON]
        API[api.js<br/>fetch + FormData]
        UI --> API
    end

    API -->|POST /api/extract<br/>multipart/form-data| PROXY[Vite dev proxy<br/>/api → :5000]

    subgraph Server["Server: Node.js + Express :5000"]
        IDX[index.js<br/>CORS, JSON, routes]
        RT[routes/extract.js]
        UP[middleware/upload.js<br/>multer, memory storage<br/>PDF only, max 10 MB]
        subgraph Extractors
            TX[text.js<br/>pdf-parse]
            RW[rows.js<br/>pdfjs-dist<br/>group by y-position]
            FD[fields.js<br/>regex patterns]
        end
        EH[middleware/errorHandler.js]

        IDX --> RT
        RT --> UP
        UP -->|buffer| TX
        UP -->|buffer| RW
        TX -->|text| FD
        RT -.->|errors| EH
    end

    PROXY --> IDX
    TX --> RES
    RW --> RES
    FD --> RES
    RES[[JSON response<br/>fileName, pages, info,<br/>fields, rows, text,<br/>isLikelyScanned]] -->|200 OK| API
    EH -->|400 / 422 / 500<br/>error message| API
```

## Request flow

```mermaid
flowchart TD
    A[User selects PDF] --> B{Is it a PDF?}
    B -- No --> E1[Inline error: choose a .pdf]
    B -- Yes --> C[Upload: POST /api/extract]
    C --> D{Multer validation<br/>PDF type, max 10 MB}
    D -- Fail --> E2[400 error]
    D -- Pass --> F[Extract text<br/>pdf-parse]
    F -- Fail --> E3[422 unreadable PDF]
    F --> G[Extract rows and fields<br/>pdfjs-dist + regex]
    G --> H{Under 20 chars per page?}
    H -- Yes --> I[isLikelyScanned = true]
    H -- No --> J[isLikelyScanned = false]
    I --> K[Return JSON and render tabs]
    J --> K
```
