#!/usr/bin/env python
"""Sync Google Search Console performance data into local SEO snapshots."""

from __future__ import annotations

import json
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build


ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / ".seo" / "config.json"
EXAMPLE_CONFIG_PATH = ROOT / ".seo" / "config.example.json"
SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"]


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def abs_path(path_value: str) -> Path:
    path = Path(path_value)
    return path if path.is_absolute() else ROOT / path


def require_config() -> dict[str, Any]:
    if not CONFIG_PATH.exists():
        raise SystemExit(
            "Missing .seo/config.json\n"
            "Create it with:\n"
            "  Copy-Item .seo\\config.example.json .seo\\config.json\n"
            f"Template: {EXAMPLE_CONFIG_PATH}"
        )
    return read_json(CONFIG_PATH)


def authorize(credentials_path: Path, token_path: Path) -> Credentials:
    if not credentials_path.exists():
        raise SystemExit(
            f"Missing OAuth client JSON: {credentials_path}\n"
            "Create a Desktop app OAuth client in Google Cloud Console and save it there."
        )

    creds: Credentials | None = None
    if token_path.exists():
        creds = Credentials.from_authorized_user_file(str(token_path), SCOPES)

    if creds and creds.valid:
        return creds

    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
    else:
        flow = InstalledAppFlow.from_client_secrets_file(str(credentials_path), SCOPES)
        creds = flow.run_local_server(port=0, prompt="consent")

    token_path.parent.mkdir(parents=True, exist_ok=True)
    token_path.write_text(creds.to_json(), encoding="utf-8")
    return creds


def date_range(end: date, days: int) -> tuple[str, str]:
    start = end - timedelta(days=days - 1)
    return start.isoformat(), end.isoformat()


def query(service: Any, site_url: str, start_date: str, end_date: str, dimensions: list[str], row_limit: int) -> list[dict[str, Any]]:
    body = {
        "startDate": start_date,
        "endDate": end_date,
        "dimensions": dimensions,
        "type": "web",
        "rowLimit": row_limit,
        "aggregationType": "auto",
    }
    response = service.searchanalytics().query(siteUrl=site_url, body=body).execute()
    return response.get("rows", [])


def summarize(rows: list[dict[str, Any]]) -> dict[str, float]:
    clicks = sum(float(row.get("clicks", 0)) for row in rows)
    impressions = sum(float(row.get("impressions", 0)) for row in rows)
    ctr = clicks / impressions if impressions else 0.0
    weighted_position = sum(float(row.get("position", 0)) * float(row.get("impressions", 0)) for row in rows)
    position = weighted_position / impressions if impressions else 0.0
    return {"clicks": clicks, "impressions": impressions, "ctr": ctr, "position": position}


def compare(current: dict[str, float], previous: dict[str, float]) -> dict[str, float]:
    return {
        "clicks_delta": current["clicks"] - previous["clicks"],
        "impressions_delta": current["impressions"] - previous["impressions"],
        "ctr_delta": current["ctr"] - previous["ctr"],
        "position_delta": current["position"] - previous["position"],
    }


def row_key(row: dict[str, Any], index: int) -> str:
    keys = row.get("keys") or []
    return str(keys[index]) if len(keys) > index else ""


def low_ctr_opportunities(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    candidates = [
        row for row in rows
        if float(row.get("impressions", 0)) >= 50
        and float(row.get("position", 0)) <= 10
        and float(row.get("ctr", 0)) < 0.03
    ]
    return sorted(candidates, key=lambda row: (-float(row.get("impressions", 0)), float(row.get("position", 0))))[:20]


def striking_distance(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    candidates = [
        row for row in rows
        if float(row.get("impressions", 0)) >= 30
        and 4 <= float(row.get("position", 0)) <= 15
    ]
    return sorted(candidates, key=lambda row: (float(row.get("position", 0)), -float(row.get("impressions", 0))))[:20]


def pct(value: float) -> str:
    return f"{value * 100:.2f}%"


def num(value: float) -> str:
    return f"{value:.2f}"


def md_row(values: list[Any]) -> str:
    return "| " + " | ".join(str(value) for value in values) + " |"


def report_markdown(snapshot: dict[str, Any]) -> str:
    current = snapshot["summary"]["current"]
    previous = snapshot["summary"]["previous"]
    delta = snapshot["summary"]["delta"]
    lines: list[str] = []

    lines.extend([
        "# GSC SEO + GEO Report",
        "",
        f"- Generated: {snapshot['generatedAt']}",
        f"- Site: `{snapshot['siteUrl']}`",
        f"- Current period: {snapshot['ranges']['current']['startDate']} to {snapshot['ranges']['current']['endDate']}",
        f"- Previous period: {snapshot['ranges']['previous']['startDate']} to {snapshot['ranges']['previous']['endDate']}",
        "",
        "## Summary",
        "",
        md_row(["Metric", "Current", "Previous", "Delta"]),
        md_row(["---", "---:", "---:", "---:"]),
        md_row(["Clicks", int(current["clicks"]), int(previous["clicks"]), f"{delta['clicks_delta']:.2f}"]),
        md_row(["Impressions", int(current["impressions"]), int(previous["impressions"]), f"{delta['impressions_delta']:.2f}"]),
        md_row(["CTR", pct(current["ctr"]), pct(previous["ctr"]), pct(delta["ctr_delta"])]),
        md_row(["Avg position", num(current["position"]), num(previous["position"]), num(delta["position_delta"])]),
        "",
        "## Low CTR Opportunities",
        "",
        md_row(["Query", "Page", "Clicks", "Impressions", "CTR", "Position"]),
        md_row(["---", "---", "---:", "---:", "---:", "---:"]),
    ])

    for row in snapshot["opportunities"]["lowCtr"]:
        lines.append(md_row([row_key(row, 0), row_key(row, 1), int(row["clicks"]), int(row["impressions"]), pct(row["ctr"]), num(row["position"])]))

    lines.extend([
        "",
        "## Striking Distance",
        "",
        md_row(["Query", "Page", "Clicks", "Impressions", "CTR", "Position"]),
        md_row(["---", "---", "---:", "---:", "---:", "---:"]),
    ])

    for row in snapshot["opportunities"]["strikingDistance"]:
        lines.append(md_row([row_key(row, 0), row_key(row, 1), int(row["clicks"]), int(row["impressions"]), pct(row["ctr"]), num(row["position"])]))

    lines.extend([
        "",
        "## Top Pages",
        "",
        md_row(["Page", "Clicks", "Impressions", "CTR", "Position"]),
        md_row(["---", "---:", "---:", "---:", "---:"]),
    ])

    for row in snapshot["current"]["pages"][:20]:
        lines.append(md_row([row_key(row, 0), int(row["clicks"]), int(row["impressions"]), pct(row["ctr"]), num(row["position"])]))

    lines.extend([
        "",
        "## How To Use This",
        "",
        "Pick exactly 3 actions:",
        "",
        "1. Rewrite one low-CTR title/meta/intro.",
        "2. Strengthen one striking-distance page with a clearer answer section and internal links.",
        "3. Add one GEO-friendly decision/help section that answers a real parent question.",
        "",
    ])

    return "\n".join(lines)


def main() -> None:
    config = require_config()
    site_url = config["siteUrl"]
    credentials_path = abs_path(config["credentialsPath"])
    token_path = abs_path(config["tokenPath"])
    data_dir = abs_path(config["dataDir"])
    report_path = abs_path(config["reportPath"])
    row_limit = int(config.get("rowLimit", 25000))
    lookback_days = int(config.get("lookbackDays", 28))
    data_delay_days = int(config.get("dataDelayDays", 3))

    creds = authorize(credentials_path, token_path)
    service = build("searchconsole", "v1", credentials=creds)

    current_end = date.today() - timedelta(days=data_delay_days)
    current_start, current_end_s = date_range(current_end, lookback_days)
    previous_end = current_end - timedelta(days=lookback_days)
    previous_start, previous_end_s = date_range(previous_end, lookback_days)
    long_start, long_end_s = date_range(current_end, 486)

    print(f"Fetching GSC data for {site_url}")
    print(f"Current:  {current_start} to {current_end_s}")
    print(f"Previous: {previous_start} to {previous_end_s}")

    current_queries = query(service, site_url, current_start, current_end_s, ["query"], row_limit)
    current_pages = query(service, site_url, current_start, current_end_s, ["page"], row_limit)
    current_query_pages = query(service, site_url, current_start, current_end_s, ["query", "page"], row_limit)
    current_devices = query(service, site_url, current_start, current_end_s, ["device"], row_limit)
    current_countries = query(service, site_url, current_start, current_end_s, ["country"], row_limit)
    previous_queries = query(service, site_url, previous_start, previous_end_s, ["query"], row_limit)
    previous_pages = query(service, site_url, previous_start, previous_end_s, ["page"], row_limit)
    long_pages = query(service, site_url, long_start, long_end_s, ["page"], row_limit)

    current_summary = summarize(current_queries)
    previous_summary = summarize(previous_queries)

    snapshot = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "siteUrl": site_url,
        "ranges": {
            "current": {"startDate": current_start, "endDate": current_end_s, "days": lookback_days},
            "previous": {"startDate": previous_start, "endDate": previous_end_s, "days": lookback_days},
            "long": {"startDate": long_start, "endDate": long_end_s, "days": 486},
        },
        "summary": {
            "current": current_summary,
            "previous": previous_summary,
            "delta": compare(current_summary, previous_summary),
        },
        "current": {
            "queries": current_queries,
            "pages": current_pages,
            "queryPages": current_query_pages,
            "devices": current_devices,
            "countries": current_countries,
        },
        "previous": {
            "queries": previous_queries,
            "pages": previous_pages,
        },
        "long": {
            "pages": long_pages,
        },
        "opportunities": {
            "lowCtr": low_ctr_opportunities(current_query_pages),
            "strikingDistance": striking_distance(current_query_pages),
        },
    }

    today = date.today().isoformat()
    snapshot_path = data_dir / "snapshots" / f"{today}.json"
    latest_path = data_dir / "latest.json"

    write_json(snapshot_path, snapshot)
    write_json(latest_path, snapshot)
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(report_markdown(snapshot), encoding="utf-8")

    print(f"Saved snapshot: {snapshot_path}")
    print(f"Saved latest:   {latest_path}")
    print(f"Saved report:   {report_path}")
    print("Done.")


if __name__ == "__main__":
    main()
