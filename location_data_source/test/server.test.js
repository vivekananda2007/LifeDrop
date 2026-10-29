import assert from "node:assert/strict";
import test from "node:test";
import { app } from "../src/server.js";
import { loadStore } from "../src/store.js";

test("serves synchronized location data", async () => {
  await loadStore();
  const server = app.listen(0, "127.0.0.1");

  try {
    await new Promise((resolve) => server.once("listening", resolve));
    const address = server.address();
    const response = await fetch(
      `http://127.0.0.1:${address.port}/api/cities?stateCode=18&q=moran`
    );
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.ok(body.data.some((item) => item.name === "Moran Town"));
    assert.ok(response.headers.get("cache-control").includes("public"));
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("serves Swagger UI documentation on /docs", async () => {
  const server = app.listen(0, "127.0.0.1");

  try {
    await new Promise((resolve) => server.once("listening", resolve));
    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}/docs`);
    const text = await response.text();

    assert.equal(response.status, 200);
    assert.ok(response.headers.get("content-type").includes("text/html"));
    assert.ok(text.includes("SwaggerUIBundle"));
    assert.ok(text.includes("/openapi.json"));
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("serves OpenAPI 3.0 specification on /openapi.json", async () => {
  const server = app.listen(0, "127.0.0.1");

  try {
    await new Promise((resolve) => server.once("listening", resolve));
    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}/openapi.json`);
    const spec = await response.json();

    assert.equal(response.status, 200);
    assert.equal(spec.openapi, "3.0.3");
    assert.ok(spec.paths["/api/cities"]);
    assert.ok(spec.paths["/api/states"]);
    assert.ok(spec.paths["/api/districts"]);
    assert.ok(spec.paths["/api/subdistricts"]);
    assert.ok(spec.paths["/api/search"]);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("serves landing page for browser requests and json for API requests", async () => {
  const server = app.listen(0, "127.0.0.1");

  try {
    await new Promise((resolve) => server.once("listening", resolve));
    const address = server.address();

    // HTML request
    const htmlRes = await fetch(`http://127.0.0.1:${address.port}/`, {
      headers: { Accept: "text/html,application/xhtml+xml" }
    });
    const htmlText = await htmlRes.text();
    assert.equal(htmlRes.status, 200);
    assert.ok(htmlText.includes("Indian Cities"));

    // JSON request
    const jsonRes = await fetch(`http://127.0.0.1:${address.port}/`, {
      headers: { Accept: "application/json" }
    });
    const jsonData = await jsonRes.json();
    assert.equal(jsonRes.status, 200);
    assert.equal(jsonData.documentation, "/docs");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
