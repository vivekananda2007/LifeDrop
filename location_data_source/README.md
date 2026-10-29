# 🇮🇳 Indian Cities & Administrative Data API

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![OpenAPI 3.0](https://img.shields.io/badge/OpenAPI-3.0.3-green.svg)](https://swagger.io/specification/)
[![Swagger UI](https://img.shields.io/badge/Swagger%20UI-Interactive-orange.svg)](https://swagger.io/tools/swagger-ui/)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fkalyangupta12%2Findian-cities-data)
[![Node.js Version](https://img.shields.io/badge/Node.js-%3E%3D20-blue.svg)](https://nodejs.org/)
[![LGD Verified](https://img.shields.io/badge/LGD-Data%20Verified-brightgreen.svg)](https://lgdirectory.gov.in)

> **Free, open-source, edge-cached REST API and interactive Swagger UI for Indian Cities, States, Districts, Sub-districts (Tehsils/Taluks), and Urban Local Bodies.** Derived directly from the Government of India's **Local Government Directory (LGD)**.

---

## 🌟 Highlights

- 🇮🇳 **Complete Geodata Hierarchy**: 36 States & Union Territories, 784 Districts, 7,092 Sub-districts (Tehsils/Taluks/Mandals), and 5,050+ Urban Local Bodies (Municipal Corporations, Municipalities, Town Panchayats).
- ⚡ **Zero-Config Serverless**: Built-in Vercel configuration (`vercel.json` and `api/index.js`) with edge caching (`Cache-Control: s-maxage=86400`).
- 📖 **Interactive Swagger UI**: Explore and test API endpoints directly in your browser with full request/response schemas.
- 🔍 **Fuzzy & Substring Search**: Case-insensitive instant search on any city, state, or district name.
- 📦 **No Database Required**: Pre-indexed lightweight JSON files (~1.6 MB total) load in memory in under 30ms.
- 🌐 **CORS Enabled**: Ready to plug directly into front-end apps, dropdown cascades, and mobile apps.

---

## 🚀 Live Demo & Interactive Swagger UI

| Resource | Description | Route |
| :--- | :--- | :--- |
| **Live Swagger UI** | Complete OpenAPI 3.0 visual test console | [https://lgd-json-api.vercel.app/docs](https://lgd-json-api.vercel.app/docs) |
| **Developer Landing Page** | Live query runner, stats, and quick links | [https://lgd-json-api.vercel.app](https://lgd-json-api.vercel.app) |
| **OpenAPI Specification** | Raw OpenAPI 3.0.3 JSON schema | [https://lgd-json-api.vercel.app/openapi.json](https://lgd-json-api.vercel.app/openapi.json) |

---

## ⚡ Quickstart

### 1. Run with Docker or Local Node

```bash
# Clone the repository
git clone https://github.com/kalyangupta12/indian-cities-data.git
cd indian-cities-data

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit **`http://localhost:3000/docs`** to test all endpoints in Swagger UI.

---

## ☁️ Deploy to Vercel in 1 Click

You can deploy this entire API to **Vercel** with a single click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fkalyangupta12%2Findian-cities-data)

### Deploying via Vercel CLI:
```bash
npx vercel
```

Because `data/generated/` is bundled and edge cache headers are enabled, the API runs serverless with lightning-fast CDN response times.

---

## 📚 API Reference

Every collection endpoint supports pagination (`page=1`, `limit=25`, max `limit=100`) and case-insensitive query searching (`q=...`).

### 1. States & Union Territories
Returns all 28 States and 8 Union Territories in India.

```http
GET /api/states
GET /api/states?q=kerala
GET /api/states?type=S       # 'S' for State, 'U' for Union Territory
```

### 2. Districts
Returns districts, filterable by parent state code or searchable by district name.

```http
GET /api/districts?stateCode=18   # Assam districts
GET /api/districts?q=pune
```

### 3. Sub-districts (Tehsils / Taluks / Mandals)
Returns sub-districts, filterable by district code or state code.

```http
GET /api/subdistricts?districtCode=310   # Dibrugarh subdistricts
GET /api/subdistricts?q=haveli
```

### 4. Cities & Urban Local Bodies (ULBs)
Returns Indian cities, municipal corporations, municipalities, and town committees.

```http
GET /api/cities?q=delhi
GET /api/cities?stateCode=27&limit=50   # Maharashtra cities
```

### 5. Unified Global Search
Searches across all administrative levels (States, Districts, Sub-districts, Cities) simultaneously with a single keyword.

```http
GET /api/search?q=mumbai&limit=5
```

### 6. System & Metadata
```http
GET /api/health     # Operational status and sync timestamp
GET /api/metadata   # LGD source archives, record counts, and dates
```

---

## 💻 Code Examples

### cURL
```bash
curl -X GET "https://your-vercel-domain.vercel.app/api/cities?q=bengaluru" \
  -H "Accept: application/json"
```

### JavaScript / Fetch
```javascript
const response = await fetch("https://your-vercel-domain.vercel.app/api/cities?q=jaipur");
const { data, pagination } = await response.json();
console.log(data);
```

### Python
```python
import requests

res = requests.get("https://your-vercel-domain.vercel.app/api/districts", params={"stateCode": "27"})
districts = res.json()["data"]
for d in districts:
    print(d["name"])
```

---

## 📊 Dataset Statistics

| Entity | Count | Source |
| :--- | :--- | :--- |
| **States & Union Territories** | 36 | Ministry of Panchayati Raj (LGD) |
| **Districts** | 784 | Ministry of Panchayati Raj (LGD) |
| **Sub-districts (Tehsils / Taluks)** | 7,092 | Ministry of Panchayati Raj (LGD) |
| **Cities / Urban Local Bodies** | 5,050+ | Ministry of Housing & Urban Affairs / LGD |
| **Villages (Optional)** | 600,000+ | Available via `INCLUDE_VILLAGES=true npm run sync` |

---

## 🎯 Use Cases (Why Use This API?)

- **Cascading Dropdowns**: Seamless State &rarr; District &rarr; Tehsil &rarr; City selection for Indian addresses.
- **E-Commerce & Logistics Checkout**: Validate user-entered cities, taluks, and districts against official government standard names.
- **Fintech & KYC Forms**: Clean administrative hierarchy matching RBI and UIDAI address verification standards.
- **Data Analytics & Research**: Census, socioeconomic, and geospatial studies of Indian urban and rural regions.
- **Pincode Alternative**: Many informal city names lack unique pincodes; LGD codes provide official persistent identifiers.

---

## 🔄 Refreshing the Dataset

The dataset is derived from the public LGD snapshot archives. You can resynchronize with the latest upstream data at any time:

```bash
npm run sync
```

To include the full 600,000+ village dataset (note: requires ~1 GB disk space):
```bash
INCLUDE_VILLAGES=true npm run sync
```

---

## 🤝 Authors & Credits

- **Creator & Maintainer**: [Kalyan Gupta](https://github.com/kalyangupta12)
- **Co-authored with**: **Google Gemini** (Gemini 3.8 / DeepMind Agentic Pair Programmer)
- **Data Source**: Derived from Government of India's [Local Government Directory (LGD)](https://lgdirectory.gov.in) via open archive snapshots curated by `ramSeraph/opendata`.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
