import assert from "node:assert/strict";
import test from "node:test";
import { normalizeRecord } from "../src/normalize.js";
import { queryCollection } from "../src/query.js";

test("normalizes an LGD district row", () => {
  const record = normalizeRecord("districts", {
    "District Code": "310",
    "District Name(In English)": "DIBRUGARH",
    "State Code": "18",
    "State Name (In English)": "ASSAM"
  });

  assert.deepEqual(record, {
    code: "310",
    name: "DIBRUGARH",
    stateCode: "18",
    stateName: "ASSAM"
  });
});

test("filters and paginates records", () => {
  const records = [
    { code: "1", name: "Moran", stateCode: "18" },
    { code: "2", name: "Moranhat", stateCode: "18" },
    { code: "3", name: "Mumbai", stateCode: "27" }
  ];

  const result = queryCollection(
    records,
    { q: "moran", stateCode: "18", page: "1", limit: "1" },
    ["stateCode"]
  );

  assert.equal(result.data.length, 1);
  assert.equal(result.pagination.total, 2);
  assert.equal(result.pagination.pages, 2);
});
