#!/usr/bin/env ruby
# frozen_string_literal: true

require "cgi"
require "date"
require "fileutils"
require "json"
require "net/http"
require "securerandom"
require "uri"
require "webrick"

ROOT = File.expand_path("..", __dir__)
CONFIG_PATH = File.join(ROOT, ".seo", "config.json")
EXAMPLE_CONFIG_PATH = File.join(ROOT, ".seo", "config.example.json")
TOKEN_URL = "https://oauth2.googleapis.com/token"
AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
API_ROOT = "https://www.googleapis.com/webmasters/v3"
SCOPE = "https://www.googleapis.com/auth/webmasters.readonly"

def read_json(path)
  JSON.parse(File.read(path, encoding: "UTF-8"))
end

def write_json(path, data)
  FileUtils.mkdir_p(File.dirname(path))
  File.write(path, JSON.pretty_generate(data) + "\n", encoding: "UTF-8")
end

def absolute_path(path)
  File.expand_path(path, ROOT)
end

def require_config
  unless File.exist?(CONFIG_PATH)
    warn "Missing .seo/config.json"
    warn "Create it with:"
    warn "  Copy-Item .seo\\config.example.json .seo\\config.json"
    warn "Template: #{EXAMPLE_CONFIG_PATH}"
    exit 1
  end

  read_json(CONFIG_PATH)
end

def oauth_client(credentials_path)
  unless File.exist?(credentials_path)
    warn "Missing OAuth client JSON: #{credentials_path}"
    warn "Download a Desktop app OAuth client from Google Cloud Console."
    exit 1
  end

  raw = read_json(credentials_path)
  client = raw["installed"] || raw["web"] || raw

  {
    "client_id" => client.fetch("client_id"),
    "client_secret" => client.fetch("client_secret", nil)
  }
end

def post_form(url, form)
  uri = URI(url)
  response = Net::HTTP.post_form(uri, form)
  body = JSON.parse(response.body)
  return body if response.is_a?(Net::HTTPSuccess)

  raise "OAuth request failed: #{response.code} #{body}"
end

def fetch_token_with_browser(client, token_path)
  port = 53_682
  redirect_uri = "http://127.0.0.1:#{port}/oauth2callback"
  state = SecureRandom.hex(16)
  code_holder = {}

  server = WEBrick::HTTPServer.new(
    Port: port,
    BindAddress: "127.0.0.1",
    Logger: WEBrick::Log.new(File::NULL),
    AccessLog: []
  )

  server.mount_proc "/oauth2callback" do |request, response|
    if request.query["state"] != state
      response.status = 400
      response.body = "State mismatch. You can close this tab."
    elsif request.query["code"]
      code_holder[:code] = request.query["code"]
      response.status = 200
      response.body = "Authorization complete. You can close this tab and return to the terminal."
    else
      response.status = 400
      response.body = "Missing authorization code. You can close this tab."
    end

    Thread.new { sleep 1; server.shutdown }
  end

  server_thread = Thread.new { server.start }

  auth_params = {
    "client_id" => client["client_id"],
    "redirect_uri" => redirect_uri,
    "response_type" => "code",
    "scope" => SCOPE,
    "access_type" => "offline",
    "prompt" => "consent",
    "state" => state
  }
  auth_uri = URI(AUTH_URL)
  auth_uri.query = URI.encode_www_form(auth_params)

  puts
  puts "Open this URL in your browser and approve read-only GSC access:"
  puts auth_uri.to_s
  puts
  puts "Waiting for OAuth callback on #{redirect_uri} ..."

  server_thread.join
  code = code_holder[:code]
  raise "OAuth flow did not return a code." unless code

  token = post_form(TOKEN_URL, {
    "client_id" => client["client_id"],
    "client_secret" => client["client_secret"],
    "code" => code,
    "grant_type" => "authorization_code",
    "redirect_uri" => redirect_uri
  })

  token["created_at"] = Time.now.to_i
  write_json(token_path, token)
  token
end

def ensure_access_token(client, token_path)
  token = if File.exist?(token_path)
            read_json(token_path)
          else
            fetch_token_with_browser(client, token_path)
          end

  expires_at = token.fetch("created_at", 0).to_i + token.fetch("expires_in", 0).to_i
  return token["access_token"] if token["access_token"] && Time.now.to_i < expires_at - 60

  refresh_token = token["refresh_token"]
  raise "Missing refresh_token. Delete #{token_path} and run OAuth again." unless refresh_token

  refreshed = post_form(TOKEN_URL, {
    "client_id" => client["client_id"],
    "client_secret" => client["client_secret"],
    "refresh_token" => refresh_token,
    "grant_type" => "refresh_token"
  })

  token.merge!(refreshed)
  token["refresh_token"] ||= refresh_token
  token["created_at"] = Time.now.to_i
  write_json(token_path, token)
  token.fetch("access_token")
end

def api_post(access_token, path, payload)
  uri = URI("#{API_ROOT}#{path}")
  request = Net::HTTP::Post.new(uri)
  request["Authorization"] = "Bearer #{access_token}"
  request["Content-Type"] = "application/json"
  request.body = JSON.generate(payload)

  response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
    http.request(request)
  end

  body = response.body.nil? || response.body.empty? ? {} : JSON.parse(response.body)
  return body if response.is_a?(Net::HTTPSuccess)

  raise "API request failed #{response.code}: #{body}"
end

def query_search_analytics(access_token, site_url, start_date, end_date, dimensions, row_limit)
  encoded_site = CGI.escape(site_url)
  payload = {
    "startDate" => start_date,
    "endDate" => end_date,
    "dimensions" => dimensions,
    "type" => "web",
    "rowLimit" => row_limit,
    "aggregationType" => "auto"
  }

  api_post(access_token, "/sites/#{encoded_site}/searchAnalytics/query", payload).fetch("rows", [])
end

def date_range(end_date, days)
  start_date = end_date - days + 1
  [start_date.iso8601, end_date.iso8601]
end

def summarize(rows)
  rows.each_with_object({ "clicks" => 0, "impressions" => 0, "ctr" => 0.0, "position" => 0.0 }) do |row, memo|
    memo["clicks"] += row.fetch("clicks", 0).to_f
    memo["impressions"] += row.fetch("impressions", 0).to_f
  end.tap do |memo|
    memo["ctr"] = memo["impressions"].positive? ? memo["clicks"] / memo["impressions"] : 0.0
    weighted_position = rows.sum { |row| row.fetch("position", 0).to_f * row.fetch("impressions", 0).to_f }
    memo["position"] = memo["impressions"].positive? ? weighted_position / memo["impressions"] : 0.0
  end
end

def pct(value)
  "#{(value.to_f * 100).round(2)}%"
end

def num(value)
  value.to_f.round(2)
end

def key(row, index)
  row.fetch("keys", [])[index].to_s
end

def low_ctr_opportunities(query_page_rows)
  query_page_rows
    .select { |row| row["impressions"].to_f >= 50 && row["position"].to_f <= 10 && row["ctr"].to_f < 0.03 }
    .sort_by { |row| [-row["impressions"].to_f, row["position"].to_f] }
    .first(20)
end

def striking_distance(query_page_rows)
  query_page_rows
    .select { |row| row["impressions"].to_f >= 30 && row["position"].to_f >= 4 && row["position"].to_f <= 15 }
    .sort_by { |row| [row["position"].to_f, -row["impressions"].to_f] }
    .first(20)
end

def compare_summary(current, previous)
  {
    "clicks_delta" => current["clicks"] - previous["clicks"],
    "impressions_delta" => current["impressions"] - previous["impressions"],
    "ctr_delta" => current["ctr"] - previous["ctr"],
    "position_delta" => current["position"] - previous["position"]
  }
end

def table_row(values)
  "| #{values.join(' | ')} |"
end

def report_markdown(snapshot)
  current = snapshot.fetch("summary").fetch("current")
  previous = snapshot.fetch("summary").fetch("previous")
  delta = snapshot.fetch("summary").fetch("delta")
  rows = []

  rows << "# GSC SEO Report"
  rows << ""
  rows << "- Generated: #{snapshot['generatedAt']}"
  rows << "- Site: `#{snapshot['siteUrl']}`"
  rows << "- Current period: #{snapshot.dig('ranges', 'current', 'startDate')} to #{snapshot.dig('ranges', 'current', 'endDate')}"
  rows << "- Previous period: #{snapshot.dig('ranges', 'previous', 'startDate')} to #{snapshot.dig('ranges', 'previous', 'endDate')}"
  rows << ""
  rows << "## Summary"
  rows << ""
  rows << table_row(["Metric", "Current", "Previous", "Delta"])
  rows << table_row(["---", "---:", "---:", "---:"])
  rows << table_row(["Clicks", current["clicks"].to_i, previous["clicks"].to_i, delta["clicks_delta"].round(2)])
  rows << table_row(["Impressions", current["impressions"].to_i, previous["impressions"].to_i, delta["impressions_delta"].round(2)])
  rows << table_row(["CTR", pct(current["ctr"]), pct(previous["ctr"]), pct(delta["ctr_delta"])])
  rows << table_row(["Avg position", num(current["position"]), num(previous["position"]), num(delta["position_delta"])])
  rows << ""

  rows << "## Low CTR Opportunities"
  rows << ""
  rows << table_row(["Query", "Page", "Clicks", "Impressions", "CTR", "Position"])
  rows << table_row(["---", "---", "---:", "---:", "---:", "---:"])
  snapshot.fetch("opportunities").fetch("lowCtr").each do |row|
    rows << table_row([key(row, 0), key(row, 1), row["clicks"].to_i, row["impressions"].to_i, pct(row["ctr"]), num(row["position"])])
  end
  rows << ""

  rows << "## Striking Distance"
  rows << ""
  rows << table_row(["Query", "Page", "Clicks", "Impressions", "CTR", "Position"])
  rows << table_row(["---", "---", "---:", "---:", "---:", "---:"])
  snapshot.fetch("opportunities").fetch("strikingDistance").each do |row|
    rows << table_row([key(row, 0), key(row, 1), row["clicks"].to_i, row["impressions"].to_i, pct(row["ctr"]), num(row["position"])])
  end
  rows << ""

  rows << "## Top Pages"
  rows << ""
  rows << table_row(["Page", "Clicks", "Impressions", "CTR", "Position"])
  rows << table_row(["---", "---:", "---:", "---:", "---:"])
  snapshot.dig("current", "pages").first(20).each do |row|
    rows << table_row([key(row, 0), row["clicks"].to_i, row["impressions"].to_i, pct(row["ctr"]), num(row["position"])])
  end
  rows << ""

  rows.join("\n")
end

config = require_config
credentials_path = absolute_path(config.fetch("credentialsPath"))
token_path = absolute_path(config.fetch("tokenPath"))
data_dir = absolute_path(config.fetch("dataDir"))
report_path = absolute_path(config.fetch("reportPath"))
site_url = config.fetch("siteUrl")
row_limit = config.fetch("rowLimit", 25_000).to_i
lookback_days = config.fetch("lookbackDays", 28).to_i
data_delay_days = config.fetch("dataDelayDays", 3).to_i

client = oauth_client(credentials_path)
access_token = ensure_access_token(client, token_path)

current_end = Date.today - data_delay_days
current_start, current_end_s = date_range(current_end, lookback_days)
previous_end = current_end - lookback_days
previous_start, previous_end_s = date_range(previous_end, lookback_days)
long_start, long_end_s = date_range(current_end, 486)

puts "Fetching GSC data for #{site_url}..."
puts "Current:  #{current_start} to #{current_end_s}"
puts "Previous: #{previous_start} to #{previous_end_s}"

current_queries = query_search_analytics(access_token, site_url, current_start, current_end_s, ["query"], row_limit)
current_pages = query_search_analytics(access_token, site_url, current_start, current_end_s, ["page"], row_limit)
current_query_pages = query_search_analytics(access_token, site_url, current_start, current_end_s, ["query", "page"], row_limit)
current_devices = query_search_analytics(access_token, site_url, current_start, current_end_s, ["device"], row_limit)
current_countries = query_search_analytics(access_token, site_url, current_start, current_end_s, ["country"], row_limit)
previous_queries = query_search_analytics(access_token, site_url, previous_start, previous_end_s, ["query"], row_limit)
previous_pages = query_search_analytics(access_token, site_url, previous_start, previous_end_s, ["page"], row_limit)
long_pages = query_search_analytics(access_token, site_url, long_start, long_end_s, ["page"], row_limit)

current_summary = summarize(current_queries)
previous_summary = summarize(previous_queries)

snapshot = {
  "generatedAt" => Time.now.utc.iso8601,
  "siteUrl" => site_url,
  "ranges" => {
    "current" => { "startDate" => current_start, "endDate" => current_end_s, "days" => lookback_days },
    "previous" => { "startDate" => previous_start, "endDate" => previous_end_s, "days" => lookback_days },
    "long" => { "startDate" => long_start, "endDate" => long_end_s, "days" => 486 }
  },
  "summary" => {
    "current" => current_summary,
    "previous" => previous_summary,
    "delta" => compare_summary(current_summary, previous_summary)
  },
  "current" => {
    "queries" => current_queries,
    "pages" => current_pages,
    "queryPages" => current_query_pages,
    "devices" => current_devices,
    "countries" => current_countries
  },
  "previous" => {
    "queries" => previous_queries,
    "pages" => previous_pages
  },
  "long" => {
    "pages" => long_pages
  },
  "opportunities" => {
    "lowCtr" => low_ctr_opportunities(current_query_pages),
    "strikingDistance" => striking_distance(current_query_pages)
  }
}

today = Date.today.iso8601
snapshot_path = File.join(data_dir, "snapshots", "#{today}.json")
latest_path = File.join(data_dir, "latest.json")

write_json(snapshot_path, snapshot)
write_json(latest_path, snapshot)
FileUtils.mkdir_p(File.dirname(report_path))
File.write(report_path, report_markdown(snapshot), encoding: "UTF-8")

puts "Saved snapshot: #{snapshot_path}"
puts "Saved latest:   #{latest_path}"
puts "Saved report:   #{report_path}"
puts "Done."
