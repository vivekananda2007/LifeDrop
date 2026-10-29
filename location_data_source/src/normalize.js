function cleanKey(value) {
  return String(value ?? "")
    .replace(/\uFEFF/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function cleanValue(value) {
  const text = String(value ?? "").trim();
  return text === "" ? null : text;
}

export function valueFrom(row, candidates) {
  const entries = new Map(
    Object.entries(row).map(([key, value]) => [cleanKey(key), cleanValue(value)])
  );

  for (const candidate of candidates) {
    const value = entries.get(cleanKey(candidate));
    if (value !== undefined && value !== null) return value;
  }

  return null;
}

const fields = {
  stateCode: ["State Code", "State LGD Code"],
  stateName: ["State Name(In English)", "State Name (In English)", "State Name"],
  districtCode: ["District Code", "District LGD Code"],
  districtName: ["District Name(In English)", "District Name (In English)", "District Name"],
  subdistrictCode: ["Sub District Code", "Sub-District Code", "Subdistrict Code"],
  subdistrictName: [
    "Sub District Name",
    "Sub District Name (In English)",
    "Sub-District Name",
    "Subdistrict Name"
  ],
  villageCode: ["Village Code", "Village LGD Code"],
  villageName: ["Village Name (In English)", "Village Name(In English)", "Village Name"],
  ulbCode: ["Localbody Code", "Local Body Code", "ULB Code", "Urban Local Body Code"],
  ulbName: [
    "Localbody Name (In English)",
    "Local Body Name (In English)",
    "ULB Name",
    "Urban Local Body Name"
  ]
};

export function normalizeRecord(component, row) {
  switch (component) {
    case "states":
      return {
        code: valueFrom(row, fields.stateCode),
        name: valueFrom(row, fields.stateName),
        localName: valueFrom(row, ["State Name (In Local)", "State Name(In Local)"]),
        type: valueFrom(row, ["State or UT", "State/UT"])
      };

    case "districts":
      return {
        code: valueFrom(row, fields.districtCode),
        name: valueFrom(row, fields.districtName),
        stateCode: valueFrom(row, fields.stateCode),
        stateName: valueFrom(row, fields.stateName)
      };

    case "subdistricts":
      return {
        code: valueFrom(row, fields.subdistrictCode),
        name: valueFrom(row, fields.subdistrictName),
        districtCode: valueFrom(row, fields.districtCode),
        districtName: valueFrom(row, fields.districtName),
        stateCode: valueFrom(row, fields.stateCode),
        stateName: valueFrom(row, fields.stateName)
      };

    case "urban_local_bodies":
      return {
        code: valueFrom(row, fields.ulbCode),
        name: valueFrom(row, fields.ulbName),
        typeCode: valueFrom(row, ["Localbody Type Code", "Local Body Type Code", "ULB Type Code"]),
        type: valueFrom(row, ["Localbody Type Name", "Local Body Type Name", "ULB Type"]),
        districtCode: valueFrom(row, fields.districtCode),
        districtName: valueFrom(row, fields.districtName),
        stateCode: valueFrom(row, fields.stateCode),
        stateName: valueFrom(row, fields.stateName)
      };

    case "villages":
      return {
        code: valueFrom(row, fields.villageCode),
        name: valueFrom(row, fields.villageName),
        subdistrictCode: valueFrom(row, fields.subdistrictCode),
        subdistrictName: valueFrom(row, fields.subdistrictName),
        districtCode: valueFrom(row, fields.districtCode),
        districtName: valueFrom(row, fields.districtName),
        stateCode: valueFrom(row, fields.stateCode),
        stateName: valueFrom(row, fields.stateName)
      };

    default:
      return row;
  }
}

export function isUsableRecord(record) {
  return Boolean(record && record.code && record.name);
}
