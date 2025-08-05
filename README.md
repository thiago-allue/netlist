# PCB Netlist Visualizer + Validator

This proof-of-concept application lets you upload, validate, visualize, and store PCB netlists in JSON format. It uses a **client-server architecture** with a **FastAPI** backend, **React** frontend with **Ant Design** and **React Flow**, and **MongoDB** for persistence. Everything runs locally via **Docker Compose**.

---

## Table of Contents

* [Prerequisites](https://chatgpt.com/c/68908f69-4f90-8329-ba2d-ee497ce83ff3?src=history_search&model=o4-mini#prerequisites)
* [Setup & Run](https://chatgpt.com/c/68908f69-4f90-8329-ba2d-ee497ce83ff3?src=history_search&model=o4-mini#setup--run)
* [Project Structure](https://chatgpt.com/c/68908f69-4f90-8329-ba2d-ee497ce83ff3?src=history_search&model=o4-mini#project-structure)
* [JSON Netlist Schema](https://chatgpt.com/c/68908f69-4f90-8329-ba2d-ee497ce83ff3?src=history_search&model=o4-mini#json-netlist-schema)
* [Sample Netlist](https://chatgpt.com/c/68908f69-4f90-8329-ba2d-ee497ce83ff3?src=history_search&model=o4-mini#sample-netlist)
* [API Endpoints & Examples](https://chatgpt.com/c/68908f69-4f90-8329-ba2d-ee497ce83ff3?src=history_search&model=o4-mini#api-endpoints--examples)
* [Frontend Usage](https://chatgpt.com/c/68908f69-4f90-8329-ba2d-ee497ce83ff3?src=history_search&model=o4-mini#frontend-usage)

---

## Prerequisites

1. **Ubuntu (20.04+) or macOS/Windows with WSL2**
2. [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/)
3. **Git**
4. **Node.js** (v20) & **npm** (for local frontend dev)

---

## Setup & Run

1. **Clone the repo**

   ```bash
   git clone thiago-allue/netlist_challenge
   cd netlist_challenge
   ```
2. **Start services**

   ```bash
   docker compose up --build
   ```

   * **FastAPI** backend on [http://localhost:8000](http://localhost:8000/)
   * **MongoDB** on port 27017
   * **React** frontend on [http://localhost:3000](http://localhost:3000/)
3. **First-run initialization**

   * If you see no sample data, stop and remove volumes:
     ```bash
     docker compose down -v
     docker compose up --build
     ```
   * Confirm seed scripts ran in logs (`01-indexes.js`, `02-sample-data.js`).

---

## Project Structure

```
├── backend/                # FastAPI server
│   ├── schema/             # JSON Schema definitions
│   ├── app/                # Application code
│   ├── Dockerfile
│   └── pyproject.toml
│
├── frontend/               # Vite + React + AntD client
│   ├── src/
│   ├── Dockerfile
│   └── vite.config.js      # contains proxy to backend
│
├── mongo-init/             # MongoDB init scripts (indexes, sample data)
│   ├── 01-indexes.js
│   └── 02-sample-data.js
│
├── docker-compose.yml
└── README.md               # ← you are here
```

---

## JSON Netlist Schema

Located at `backend/schema/netlist.schema.json` (JSON Schema draft-07). Key definitions:

```json
{
  // -------------------------------------------
  // PCB Netlist Schema – version 0.1
  // -------------------------------------------

  "$schema": "http://json-schema.org/draft-07/schema#",

  // A human-readable name for docs / tooling
  "title": "PCB Netlist v0.1",

  // The uploaded file must be an object
  "type": "object",

  // We insist on both top-level arrays
  "required": ["components", "nets"],

  // Disallow any extra junk at root
  "additionalProperties": false,

  "properties": {
    // -------- COMPONENTS ARRAY --------
    // Each entry is a physical part on the PCB
    // (IC, resistor, connector, etc.)
    "components": {
      "type": "array",
      "minItems": 1,                     // at least one part
      "items": { "$ref": "#/definitions/component" }
    },

    // ------------- NETS ARRAY -------------
    // Electrical connections tying pins
    // together (e.g. GND, VCC, SPI_MISO).
    "nets": {
      "type": "array",
      "minItems": 1,
      "items": { "$ref": "#/definitions/net" }
    }
  },

  // =========================================================================
  // Re-usable sub-schemas live under /definitions
  // =========================================================================
  "definitions": {
    // A single pin (pad) on a component
    "pin": {
      "type": "object",
      "required": ["id", "name"],
      "additionalProperties": false,
      "properties": {
        "id": {
          "type": "string",
          "pattern": "^[A-Za-z0-9_\\-]+$"   // slug – no spaces
        },
        "name": {
          "type": "string",
          "minLength": 1                   // must not be blank
        }
      }
    },

    // One placed part on the board
    "component": {
      "type": "object",
      "required": ["id", "name", "type", "pins"],
      "additionalProperties": false,
      "properties": {
        "id": {
          "type": "string",
          "pattern": "^[A-Za-z0-9_\\-]+$"
        },
        "name": {
          "type": "string",
          "minLength": 1
        },
        "type": {
          "type": "string",
          "minLength": 1          // e.g. "IC", "Resistor"
        },
        "pins": {
          "type": "array",
          "minItems": 1,
          "items": { "$ref": "#/definitions/pin" }
        }
      }
    },

    // A (component.pin) endpoint present on a net
    "connection": {
      "type": "object",
      "required": ["componentId", "pinId"],
      "additionalProperties": false,
      "properties": {
        "componentId": {
          "type": "string",
          "pattern": "^[A-Za-z0-9_\\-]+$"
        },
        "pinId": {
          "type": "string",
          "pattern": "^[A-Za-z0-9_\\-]+$"
        }
      }
    },

    // An electrical network tying connections together
    "net": {
      "type": "object",
      "required": ["id", "name", "connections"],
      "additionalProperties": false,
      "properties": {
        "id": {
          "type": "string",
          "pattern": "^[A-Za-z0-9_\\-]+$"
        },
        "name": {
          "type": "string",
          "minLength": 1
        },
        "connections": {
          "type": "array",
          "minItems": 1,
          "items": { "$ref": "#/definitions/connection" }
        }
      }
    }
  }
}

```

This schema ensures every component lists its pins and every net lists valid connections.

---

## Sample Netlist

Save this as `sample_netlist.json` for testing:

```json
{
  "components": [
    {
      "id": "U1",
      "name": "ATmega328P",
      "type": "IC",
      "pins": [
        { "id": "1", "name": "VCC" },
        { "id": "2", "name": "GND" }
      ]
    },
    {
      "id": "R1",
      "name": "Pullup",
      "type": "Resistor",
      "pins": [
        { "id": "1", "name": "A" },
        { "id": "2", "name": "B" }
      ]
    }
  ],
  "nets": [
    {
      "id": "N1",
      "name": "GND",
      "connections": [
        { "componentId": "U1", "pinId": "2" },
        { "componentId": "R1", "pinId": "2" }
      ]
    },
    {
      "id": "N2",
      "name": "VCC",
      "connections": [
        { "componentId": "U1", "pinId": "1" }
      ]
    }
  ]
}
```

---

## API Endpoints & Examples

### 1. Upload a Netlist

* **URL:**`POST /api/netlists`
* **Headers:**`Content-Type: application/json`
* **Body:** Raw JSON or multipart file field `file`.

**Example (raw JSON):**

```bash
curl -X POST http://localhost:8000/api/netlists \
  -H "Content-Type: application/json" \
  --data-binary @sample_netlist.json
```

**Example (multipart):**

```bash
curl -X POST http://localhost:8000/api/netlists \
  -F "file=@sample_netlist.json"
```

**Response:** 201 Created

```json
{
  "id": "64ce10ca10c0a512f461fa5d",
  "status": "invalid",
  "violations": [ /* detailed */ ]
}
```

### 2. List Submissions

* **URL:**`GET /api/netlists`
* **Query Params:**`limit` (default 20), `skip` (default 0)

```bash
curl http://localhost:8000/api/netlists?limit=5&skip=0
```

**Response:**

```json
{
  "total": 3,
  "items": [
    { "id": "...", "createdAt": "2025-08-04T18:45:22Z", "status": "valid" },
    …
  ]
}
```

### 3. Get Submission Details

* **URL:**`GET /api/netlists/{id}`

```bash
curl http://localhost:8000/api/netlists/64ce10ca10c0a512f461fa5d
```

**Response:**

```json
{
  "id": "64ce10ca10c0a512f461fa5d",
  "createdAt": "2025-08-04T18:45:22Z",
  "status": "invalid",
  "violations": [ /* ... */ ],
  "netlist": { /* full JSON … */ }
}
```

---

## Frontend Usage

1. Go to [http://localhost:3000](http://localhost:3000/).
2. **Upload** page: drag-&-drop a JSON netlist. Immediate inline validation appears.
3. **Submissions** page: view history, status badges, and timestamps.
4. Click an entry to open the **Detail** view with an interactive **graph** and **violations panel**.

---