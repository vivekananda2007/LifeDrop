import json
from pathlib import Path

from flask import Blueprint, jsonify, request

location_api = Blueprint("location_api", __name__)

DATA_DIR = Path(__file__).resolve().parent / "static" / "data"


def load_locations(filename):
    file_path = DATA_DIR / filename

    with file_path.open("r", encoding="utf-8-sig") as file:
        return json.load(file)


@location_api.get("/api/locations/health")
def locations_health():
    required_files = [
        "states.json",
        "districts.json",
        "subdistricts.json",
        "urban_local_bodies.json",
    ]

    missing = [
        filename
        for filename in required_files
        if not (DATA_DIR / filename).is_file()
    ]

    if missing:
        return jsonify({
            "status": "error",
            "missing_files": missing
        }), 500

    return jsonify({
        "status": "ok",
        "message": "Offline location database is ready."
    })


@location_api.get("/api/locations/states")
def get_states():
    states = load_locations("states.json")

    return jsonify([
        {
            "code": item["code"],
            "name": item["name"]
        }
        for item in states
    ])


@location_api.get("/api/locations/districts")
def get_districts():
    state_code = request.args.get("state_code", "").strip()

    if not state_code:
        return jsonify({"error": "state_code is required"}), 400

    districts = load_locations("districts.json")

    return jsonify([
        {
            "code": item["code"],
            "name": item["name"],
            "stateCode": item["stateCode"]
        }
        for item in districts
        if item["stateCode"] == state_code
    ])


@location_api.get("/api/locations/subdistricts")
def get_subdistricts():
    district_code = request.args.get("district_code", "").strip()

    if not district_code:
        return jsonify({"error": "district_code is required"}), 400

    subdistricts = load_locations("subdistricts.json")

    return jsonify([
        {
            "code": item["code"],
            "name": item["name"],
            "districtCode": item["districtCode"],
            "stateCode": item["stateCode"]
        }
        for item in subdistricts
        if item["districtCode"] == district_code
    ])


@location_api.get("/api/locations/towns")
def get_towns():
    state_code = request.args.get("state_code", "").strip()
    district_code = request.args.get("district_code", "").strip()

    if not state_code:
        return jsonify({"error": "state_code is required"}), 400

    locations = load_locations("urban_local_bodies.json")

    return jsonify([
        {
            "code": item["code"],
            "name": item["name"],
            "districtCode": item["districtCode"],
            "stateCode": item["stateCode"]
        }
        for item in locations
        if item["stateCode"] == state_code
        and (
            not district_code
            or item["districtCode"] == district_code
        )
    ])
