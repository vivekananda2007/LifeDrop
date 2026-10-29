import cors from "cors";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { getCollection, getMetadata, loadStore } from "./store.js";
import { queryCollection } from "./query.js";
import { openApiSpec } from "./openapi.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsHtmlPath = path.resolve(__dirname, "docs.html");

let docsHtml = "";
try {
  docsHtml = fs.readFileSync(docsHtmlPath, "utf8");
} catch {
  // fallback if file not read synchronously
}

const app = express();
const port = Number(process.env.PORT) || 3000;

app.disable("x-powered-by");
app.use(cors());
app.use(express.json({ limit: "50kb" }));

// Pre-load store
await loadStore();

// Cache header middleware for API responses
const edgeCacheMiddleware = (_req, res, next) => {
  res.setHeader(
    "Cache-Control",
    "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800"
  );
  next();
};

function getDocsHtml() {
  if (docsHtml) return docsHtml;
  try {
    docsHtml = fs.readFileSync(docsHtmlPath, "utf8");
  } catch {
    // fallback
  }
  return docsHtml;
}

// Root endpoint: Serves Swagger UI to browsers, JSON summary to API clients
app.get("/", (request, response) => {
  const acceptHeader = request.headers.accept || "";
  const isHtml = acceptHeader.includes("text/html") || acceptHeader.includes("*/*");

  // If request explicitly wants JSON without HTML
  if (acceptHeader.includes("application/json") && !acceptHeader.includes("text/html")) {
    return response.json({
      name: "Indian Cities & Administrative Data API",
      description: "Free, high-performance LGD geodata API for Indian States, Districts, Tehsils, and Cities.",
      version: "1.0.0",
      documentation: "/docs",
      openapi: "/openapi.json",
      endpoints: {
        states: "/api/states",
        districts: "/api/districts?stateCode=18",
        subdistricts: "/api/subdistricts?districtCode=310",
        cities: "/api/cities?q=delhi",
        villages: "/api/villages?subdistrictCode=...",
        search: "/api/search?q=moranhat",
        metadata: "/api/metadata",
        health: "/api/health"
      }
    });
  }

  // Default: Serve Swagger UI
  response.setHeader("Content-Type", "text/html; charset=utf-8");
  return response.send(getDocsHtml());
});

// Swagger UI documentation routes
app.get(["/docs", "/swagger", "/api-docs"], (_request, response) => {
  response.setHeader("Content-Type", "text/html; charset=utf-8");
  return response.send(getDocsHtml());
});

// OpenAPI 3.0 specification JSON
app.get("/openapi.json", (_request, response) => {
  response.setHeader("Cache-Control", "public, max-age=3600, s-maxage=86400");
  response.json(openApiSpec);
});

// Health check
app.get("/api/health", (_request, response) => {
  response.json({ status: "ok", syncedAt: getMetadata().syncedAt || null });
});

// Metadata
app.get("/api/metadata", edgeCacheMiddleware, (_request, response) => {
  response.json(getMetadata());
});

// States
app.get("/api/states", edgeCacheMiddleware, (request, response) => {
  response.json(queryCollection(getCollection("states"), request.query, ["code", "type"]));
});

// Districts
app.get("/api/districts", edgeCacheMiddleware, (request, response) => {
  response.json(
    queryCollection(getCollection("districts"), request.query, ["code", "stateCode"])
  );
});

// Subdistricts (Tehsils)
app.get("/api/subdistricts", edgeCacheMiddleware, (request, response) => {
  response.json(
    queryCollection(getCollection("subdistricts"), request.query, [
      "code",
      "stateCode",
      "districtCode"
    ])
  );
});

// Cities / Urban Local Bodies
app.get("/api/cities", edgeCacheMiddleware, (request, response) => {
  response.json(
    queryCollection(getCollection("urban_local_bodies"), request.query, [
      "code",
      "stateCode",
      "districtCode",
      "typeCode"
    ])
  );
});

// Villages
app.get("/api/villages", edgeCacheMiddleware, (request, response) => {
  response.json(
    queryCollection(getCollection("villages"), request.query, [
      "code",
      "stateCode",
      "districtCode",
      "subdistrictCode"
    ])
  );
});

// Global Search
app.get("/api/search", edgeCacheMiddleware, (request, response) => {
  const q = String(request.query.q || "").trim();
  if (q.length < 2) {
    return response.status(400).json({ error: "q must contain at least 2 characters" });
  }

  const limit = Math.min(25, Math.max(1, Number.parseInt(request.query.limit, 10) || 10));
  const result = {};
  for (const name of Object.keys({
    states: 1,
    districts: 1,
    subdistricts: 1,
    urban_local_bodies: 1,
    villages: 1
  })) {
    result[name] = queryCollection(getCollection(name), { q, limit }, []).data;
  }
  return response.json({ query: q, data: result });
});

app.use((_request, response) => response.status(404).json({ error: "Route not found" }));

export { app };
export default app;

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  if (getCollection("states").length === 0) {
    console.warn("No generated data found. Run `npm run sync` before using the API.");
  }

  app.listen(port, "0.0.0.0", () => {
    console.log(`Indian Cities API & Swagger UI listening on http://localhost:${port}`);
    console.log(`Documentation available at http://localhost:${port}/docs`);
  });
}
