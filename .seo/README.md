# GSC SEO Monitoring

This folder contains the repeatable workflow for Google Search Console based SEO checks.

Generated GSC data is intentionally ignored by Git:

- `.seo/config.json`
- `.seo/credentials/`
- `.seo/gsc-data/`
- `.seo/latest-report.md`

That keeps query and performance data local while preserving the tool and process in the repo.

## One-time Setup

1. In Google Cloud Console, enable **Google Search Console API**.
2. Create OAuth credentials for a **Desktop app**.
3. Download the OAuth client JSON.
4. Save it locally as:

   ```text
   .seo/credentials/gsc-oauth-client.json
   ```

5. Copy the config template:

   ```powershell
   Copy-Item .seo\config.example.json .seo\config.json
   ```

6. Edit `.seo/config.json` if the GSC property is different.

Common property formats:

```json
"siteUrl": "sc-domain:dokipoki.lt"
```

or:

```json
"siteUrl": "https://dokipoki.lt/"
```

## Install / Update Python Dependencies

The primary connector uses Python and Google's official API libraries.

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements-seo.txt
```

## Run

```powershell
.\.venv\Scripts\python.exe scripts\gsc_sync.py
```

On first run, the script opens a local Google OAuth flow. Approve read-only access, and the token will be saved locally under `.seo/credentials/`.

There is also a Ruby fallback prototype at `scripts/gsc_sync.rb`, but the Python connector is the recommended path because it uses Google's maintained client libraries.

## Output

Each run creates:

- `.seo/gsc-data/snapshots/YYYY-MM-DD.json`
- `.seo/gsc-data/latest.json`
- `.seo/latest-report.md`

The report includes:

- summary for the last 28 days
- comparison with the previous 28 days
- high-impression low-CTR opportunities
- striking-distance queries in positions 4-15
- top pages

## 7-14 Day Workflow

1. Run `.\.venv\Scripts\python.exe scripts\gsc_sync.py` before SEO changes.
2. Commit site changes, not GSC data.
3. After 7-14 days, run the script again.
4. Ask Codex to compare `.seo/gsc-data/latest.json` and prior snapshots.
5. Pick the next 3 concrete changes from the opportunity list.
