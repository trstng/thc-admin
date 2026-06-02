import asyncio
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

_BASE_ID = os.environ["AIRTABLE_BASE_ID"]
_TOKEN = os.environ["AIRTABLE_TOKEN"]
_BASE_URL = f"https://api.airtable.com/v0/{_BASE_ID}"

TABLES = {
    "CLIENTS":         "tblvyvVX9QGSZA8Gw",
    "JOBS":            "tblzePYx3JTxpiUp9",
    "PAYMENTS":        "tblQv7pAIQQPi0HFh",
    "AUTOMATIONS_LOG": "tblrB0D6V1dt9U2wj",
}

def _headers() -> dict:
    return {"Authorization": f"Bearer {_TOKEN}", "Content-Type": "application/json"}


async def _request_with_retry(method: str, url: str, **kwargs) -> dict:
    async with httpx.AsyncClient(timeout=30) as client:
        for attempt in range(3):
            resp = await client.request(method, url, headers=_headers(), **kwargs)
            if resp.status_code == 429:
                await asyncio.sleep(0.5 * (attempt + 1))
                continue
            resp.raise_for_status()
            return resp.json()
        resp.raise_for_status()
        return resp.json()


async def get_records(
    table_id: str,
    filter_formula: str | None = None,
    fields: list[str] | None = None,
    sort: list[dict] | None = None,
) -> list[dict]:
    records: list[dict] = []
    offset: str | None = None
    while True:
        params: dict = {}
        if filter_formula:
            params["filterByFormula"] = filter_formula
        if fields:
            for f in fields:
                params.setdefault("fields[]", []).append(f)
        if sort:
            for i, s in enumerate(sort):
                params[f"sort[{i}][field]"] = s["field"]
                params[f"sort[{i}][direction]"] = s.get("direction", "asc")
        if offset:
            params["offset"] = offset

        data = await _request_with_retry("GET", f"{_BASE_URL}/{table_id}", params=params)
        records.extend(data.get("records", []))
        offset = data.get("offset")
        if not offset:
            break
    return records


async def get_record(table_id: str, record_id: str) -> dict:
    return await _request_with_retry("GET", f"{_BASE_URL}/{table_id}/{record_id}")


async def create_record(table_id: str, fields: dict) -> dict:
    return await _request_with_retry("POST", f"{_BASE_URL}/{table_id}", json={"fields": fields})


async def update_record(table_id: str, record_id: str, fields: dict) -> dict:
    return await _request_with_retry("PATCH", f"{_BASE_URL}/{table_id}/{record_id}", json={"fields": fields})
