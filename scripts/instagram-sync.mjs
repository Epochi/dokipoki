import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const dataPath = path.join(repoRoot, "_data", "instagram_feed.json");
const manualPostsPath = path.join(repoRoot, "_data", "instagram_manual_posts.json");
const cacheDir = path.join(repoRoot, "img", "instagram-cache");

const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
const userId = process.env.INSTAGRAM_USER_ID;
const apiBase = (process.env.INSTAGRAM_API_BASE || "https://graph.instagram.com").replace(/\/+$/, "");
const feedLimit = Math.max(1, parseInt(process.env.INSTAGRAM_FEED_LIMIT || "36", 10));
const initialCount = Math.max(1, parseInt(process.env.INSTAGRAM_INITIAL_COUNT || "9", 10));
const useMagick = spawnSync("magick", ["-version"], { stdio: "ignore", windowsHide: true }).status === 0;
const cacheVersion = 2;

if (!accessToken) {
  throw new Error("INSTAGRAM_ACCESS_TOKEN is required.");
}

const previousFeed = await readJson(dataPath);
const previousMediaById = new Map();

for (const item of previousFeed.items || []) {
  if (Array.isArray(item.media)) {
    for (const media of item.media) {
      previousMediaById.set(media.id, media);
    }
  } else if (item.id && item.thumb_path) {
    previousMediaById.set(item.id, item);
  }
}

const mediaFields = [
  "id",
  "caption",
  "media_type",
  "media_product_type",
  "media_url",
  "permalink",
  "thumbnail_url",
  "timestamp",
  "children{media_type,media_url,thumbnail_url,id}"
].join(",");

const rawMedia = await fetchAllMedia();
const normalizedPosts = rawMedia
  .map(normalizePost)
  .filter(Boolean);

const publicProfilePosts = await fetchPublicProfilePosts(process.env.INSTAGRAM_USERNAME || "dokipoki_personazai");
const manualPosts = await fetchManualPosts();
const mergedPosts = mergePosts(normalizedPosts, publicProfilePosts, manualPosts)
  .sort(sortPostsByTimestampDesc)
  .slice(0, feedLimit);

await fs.mkdir(cacheDir, { recursive: true });

const keepRelativePaths = new Set();
const finalItems = [];

for (const post of mergedPosts) {
  const cachedMedia = [];

  for (const media of post.media) {
    const previousMedia = previousMediaById.get(media.id);
    const cachedRelativePath = await cacheThumb(media, previousMedia);

    keepRelativePaths.add(cachedRelativePath);
    cachedMedia.push({
      id: media.id,
      kind: media.kind,
      label: media.label,
      alt: media.alt,
      thumb_path: cachedRelativePath,
      video_url: media.video_url || null
    });
  }

  finalItems.push({
    id: post.id,
    kind: post.kind,
    label: post.label,
    post_type: post.post_type,
    alt: post.alt,
    permalink: post.permalink,
    timestamp: post.timestamp,
    media_count: cachedMedia.length,
    media: cachedMedia,
    thumb_path: cachedMedia[0] ? cachedMedia[0].thumb_path : null,
    video_url: post.kind === "video" && cachedMedia[0] ? cachedMedia[0].video_url : null
  });
}

await removeStaleCacheFiles(keepRelativePaths);

const nextFeed = {
  synced_at: new Date().toISOString(),
  username: process.env.INSTAGRAM_USERNAME || "dokipoki_personazai",
  source: "instagram",
  cache_version: cacheVersion,
  initial_count: initialCount,
  items: finalItems
};

await fs.writeFile(dataPath, `${JSON.stringify(nextFeed, null, 2)}\n`, "utf8");

console.log(`Synced ${finalItems.length} Instagram post(s).`);

async function fetchAllMedia() {
  const collected = [];
  let nextUrl = buildFirstPageUrl();

  while (nextUrl && collected.length < feedLimit) {
    const payload = await fetchJson(nextUrl);
    const pageItems = Array.isArray(payload.data) ? payload.data : [];

    collected.push(...pageItems);
    nextUrl = payload.paging && payload.paging.next ? payload.paging.next : null;
  }

  return collected;
}

function buildFirstPageUrl() {
  const endpoint = userId ? `${apiBase}/${userId}/media` : `${apiBase}/me/media`;
  const url = new URL(endpoint);
  url.searchParams.set("fields", mediaFields);
  url.searchParams.set("limit", String(Math.min(feedLimit, 25)));
  url.searchParams.set("access_token", accessToken);
  return url.toString();
}

async function fetchJson(url, extraHeaders = null) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      ...(extraHeaders || {})
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Instagram sync failed (${response.status}): ${body}`);
  }

  return response.json();
}

function normalizePost(media) {
  const caption = normalizeText(media.caption);
  const permalink = media.permalink;
  const timestamp = media.timestamp || null;
  const mediaItems = [];

  if (!permalink) {
    return null;
  }

  if (media.media_type === "CAROUSEL_ALBUM" && media.children && Array.isArray(media.children.data)) {
    media.children.data.forEach((child, index) => {
      const normalizedChild = normalizeMediaItem({
        id: `${media.id}-${child.id || index + 1}`,
        mediaType: child.media_type,
        mediaProductType: media.media_product_type,
        mediaUrl: child.media_url,
        thumbUrl: child.thumbnail_url || child.media_url,
        caption,
        sequence: index + 1
      });

      if (normalizedChild) {
        mediaItems.push(normalizedChild);
      }
    });
  } else {
    const normalizedMedia = normalizeMediaItem({
      id: media.id,
      mediaType: media.media_type,
      mediaProductType: media.media_product_type,
      mediaUrl: media.media_url,
      thumbUrl: media.thumbnail_url || media.media_url,
      caption,
      sequence: 1
    });

    if (normalizedMedia) {
      mediaItems.push(normalizedMedia);
    }
  }

  if (!mediaItems.length) {
    return null;
  }

  return {
    id: sanitizeId(media.id),
    kind: mediaItems[0].kind,
    label: mediaItems.length > 1 ? "Carousel" : mediaItems[0].label,
    post_type: getPostType({
      mediaType: media.media_type,
      mediaProductType: media.media_product_type,
      mediaCount: mediaItems.length,
      permalink
    }),
    alt: caption || mediaItems[0].alt,
    permalink,
    timestamp,
    media: mediaItems
  };
}

function normalizeMediaItem(item) {
  if (!item.thumbUrl) {
    return null;
  }

  const isVideo = item.mediaType === "VIDEO";
  const label = item.mediaProductType === "REELS" ? "Reel" : (isVideo ? "Video" : "Photo");
  const baseAlt = item.caption || `Instagram ${isVideo ? "video" : "photo"} ${item.sequence}`;

  return {
    id: sanitizeId(item.id),
    kind: isVideo ? "video" : "image",
    label,
    alt: baseAlt,
    thumbUrl: item.thumbUrl,
    video_url: isVideo ? item.mediaUrl : null
  };
}

async function fetchPublicProfilePosts(username) {
  if (!username) return [];

  const endpoints = [
    `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`,
    `https://www.instagram.com/${encodeURIComponent(username)}/?__a=1&__d=dis`
  ];

  for (const endpoint of endpoints) {
    try {
      const payload = await fetchJson(endpoint, {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0",
        Referer: `https://www.instagram.com/${username}/`,
        "X-Requested-With": "XMLHttpRequest",
        "X-IG-App-ID": "936619743392459"
      });
      const posts = normalizePublicProfilePayload(payload);
      if (posts.length) return posts;
    } catch (error) {
      // Fall through to the next public endpoint. Public profile payloads are brittle.
    }
  }

  return [];
}

async function fetchManualPosts() {
  const manualConfig = await readJson(manualPostsPath);
  const entries = Array.isArray(manualConfig?.items) ? manualConfig.items : [];
  const posts = [];

  for (const entry of entries) {
    try {
      const post = await fetchManualPost(entry);
      if (post) posts.push(post);
    } catch (error) {
      console.warn(`Manual Instagram post sync skipped for ${getManualPermalink(entry)}: ${error.message}`);
    }
  }

  return posts;
}

async function fetchManualPost(entry) {
  const permalink = getManualPermalink(entry);
  if (!permalink) return null;

  const response = await fetch(permalink, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "Mozilla/5.0",
      Referer: "https://www.instagram.com/",
      "Accept-Language": "en-US,en;q=0.9"
    }
  });

  if (!response.ok) {
    throw new Error(`Instagram permalink fetch failed (${response.status})`);
  }

  const html = await response.text();
  return normalizeManualHtml(permalink, html);
}

function getManualPermalink(entry) {
  if (typeof entry === "string") return normalizeManualPermalink(entry);
  if (entry && typeof entry.permalink === "string") return normalizeManualPermalink(entry.permalink);
  return null;
}

function normalizeManualPermalink(value) {
  try {
    const url = new URL(value);
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch (error) {
    return null;
  }
}

function normalizeManualHtml(fallbackPermalink, html) {
  const metadata = extractManualMetadata(html);
  const permalink = metadata.permalink || fallbackPermalink;
  const thumbUrl = metadata.thumbUrl;
  const timestamp = metadata.timestamp || null;
  const caption = normalizeText(metadata.caption);
  const mediaType = metadata.kind === "video" ? "VIDEO" : "IMAGE";
  const mediaProductType = permalink.includes("/reel/") ? "REELS" : null;

  if (!thumbUrl) {
    return null;
  }

  const normalizedMedia = normalizeMediaItem({
    id: metadata.id || permalink,
    mediaType,
    mediaProductType,
    mediaUrl: metadata.videoUrl || thumbUrl,
    thumbUrl,
    caption,
    sequence: 1
  });

  if (!normalizedMedia) {
    return null;
  }

  return {
    id: sanitizeId(metadata.id || permalink),
    kind: normalizedMedia.kind,
    label: normalizedMedia.label,
    post_type: getPostType({
      mediaType,
      mediaProductType,
      mediaCount: 1,
      permalink
    }),
    alt: caption || normalizedMedia.alt,
    permalink,
    timestamp,
    media: [normalizedMedia]
  };
}

function extractManualMetadata(html) {
  const jsonLdObjects = extractJsonLdObjects(html);
  const primaryJsonLd = jsonLdObjects.find((item) => item && typeof item === "object") || {};
  const videoJsonLd = jsonLdObjects.find((item) => item?.["@type"] === "VideoObject") || {};
  const socialJsonLd = jsonLdObjects.find((item) => item?.["@type"] === "SocialMediaPosting") || {};

  const permalink = (
    extractMetaTag(html, "property", "og:url") ||
    extractCanonicalHref(html)
  );

  const caption = (
    socialJsonLd?.headline ||
    socialJsonLd?.articleBody ||
    videoJsonLd?.name ||
    videoJsonLd?.description ||
    primaryJsonLd?.caption ||
    extractMetaTag(html, "property", "og:title") ||
    extractMetaTag(html, "name", "description")
  );

  const thumbUrl = (
    firstArrayValue(videoJsonLd?.thumbnailUrl) ||
    extractMetaTag(html, "property", "og:image") ||
    extractMetaTag(html, "name", "twitter:image")
  );

  const videoUrl = (
    videoJsonLd?.contentUrl ||
    extractMetaTag(html, "property", "og:video") ||
    extractMetaTag(html, "property", "og:video:url")
  );

  const timestamp = (
    socialJsonLd?.datePublished ||
    videoJsonLd?.uploadDate ||
    primaryJsonLd?.uploadDate ||
    null
  );

  const identifier = (
    socialJsonLd?.identifier ||
    videoJsonLd?.identifier ||
    primaryJsonLd?.identifier ||
    permalink
  );

  return {
    id: normalizeManualIdentifier(identifier),
    permalink,
    caption,
    thumbUrl,
    videoUrl,
    timestamp,
    kind: videoUrl || (permalink && permalink.includes("/reel/")) ? "video" : "image"
  };
}

function extractJsonLdObjects(html) {
  const matches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi) || [];
  const objects = [];

  for (const match of matches) {
    const body = match
      .replace(/^<script type="application\/ld\+json">/i, "")
      .replace(/<\/script>$/i, "")
      .trim();

    try {
      const parsed = JSON.parse(body);
      if (Array.isArray(parsed)) {
        objects.push(...parsed);
      } else {
        objects.push(parsed);
      }
    } catch (error) {
      // Ignore brittle JSON-LD blocks.
    }
  }

  return objects;
}

function extractMetaTag(html, attribute, key) {
  const pattern = new RegExp(
    `<meta[^>]+${attribute}=["']${escapeRegExp(key)}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    "i"
  );
  const reversePattern = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+${attribute}=["']${escapeRegExp(key)}["'][^>]*>`,
    "i"
  );

  return html.match(pattern)?.[1] || html.match(reversePattern)?.[1] || null;
}

function extractCanonicalHref(html) {
  return html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i)?.[1] || null;
}

function firstArrayValue(value) {
  if (Array.isArray(value)) return value[0] || null;
  return value || null;
}

function normalizeManualIdentifier(value) {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "object") {
    return value?.value || value?.["@id"] || value?.id || null;
  }
  return null;
}

function normalizePublicProfilePayload(payload) {
  const user =
    payload?.data?.user ||
    payload?.graphql?.user ||
    payload?.user ||
    null;

  const edges =
    user?.edge_owner_to_timeline_media?.edges ||
    user?.timeline_media?.edges ||
    [];

  return edges
    .map((edge) => normalizePublicProfileNode(edge?.node || edge))
    .filter(Boolean);
}

function normalizePublicProfileNode(node) {
  if (!node) return null;

  const permalink = getPublicPermalink(node);
  if (!permalink) return null;

  const caption =
    normalizeText(
      node?.edge_media_to_caption?.edges?.[0]?.node?.text ||
      node?.caption ||
      node?.accessibility_caption
    );

  const mediaItems = [];
  const childEdges = node?.edge_sidecar_to_children?.edges || [];

  if (childEdges.length) {
    childEdges.forEach((edge, index) => {
      const child = edge?.node;
      const normalizedChild = normalizeMediaItem({
        id: `${node.id}-${child?.id || index + 1}`,
        mediaType: child?.is_video ? "VIDEO" : "IMAGE",
        mediaProductType: child?.product_type || node?.product_type,
        mediaUrl: child?.video_url || child?.display_url || child?.thumbnail_src,
        thumbUrl: child?.display_url || child?.thumbnail_src,
        caption,
        sequence: index + 1
      });

      if (normalizedChild) {
        mediaItems.push(normalizedChild);
      }
    });
  } else {
    const normalizedMedia = normalizeMediaItem({
      id: node.id,
      mediaType: node.is_video ? "VIDEO" : "IMAGE",
      mediaProductType: node.product_type,
      mediaUrl: node.video_url || node.display_url || node.thumbnail_src,
      thumbUrl: node.display_url || node.thumbnail_src,
      caption,
      sequence: 1
    });

    if (normalizedMedia) {
      mediaItems.push(normalizedMedia);
    }
  }

  if (!mediaItems.length) return null;

  return {
    id: sanitizeId(node.id || node.shortcode || permalink),
    kind: mediaItems[0].kind,
    label: mediaItems.length > 1 ? "Carousel" : mediaItems[0].label,
    post_type: getPostType({
      mediaType: childEdges.length ? "CAROUSEL_ALBUM" : (node.is_video ? "VIDEO" : "IMAGE"),
      mediaProductType: node.product_type,
      mediaCount: mediaItems.length,
      permalink
    }),
    alt: caption || mediaItems[0].alt,
    permalink,
    timestamp: node.taken_at_timestamp ? new Date(node.taken_at_timestamp * 1000).toISOString() : null,
    media: mediaItems
  };
}

function getPublicPermalink(node) {
  if (node?.permalink) return node.permalink;
  if (!node?.shortcode) return null;
  const base = node?.product_type === "clips" || node?.is_video ? "reel" : "p";
  return `https://www.instagram.com/${base}/${node.shortcode}/`;
}

function mergePosts(primaryPosts, supplementaryPosts, manualPosts = []) {
  const byPermalink = new Map();

  for (const post of primaryPosts) {
    byPermalink.set(post.permalink, post);
  }

  for (const post of supplementaryPosts) {
    if (!post?.permalink) continue;
    if (!byPermalink.has(post.permalink)) {
      byPermalink.set(post.permalink, post);
    }
  }

  for (const post of manualPosts) {
    if (!post?.permalink) continue;
    if (!byPermalink.has(post.permalink)) {
      byPermalink.set(post.permalink, post);
    }
  }

  return Array.from(byPermalink.values());
}

function sortPostsByTimestampDesc(a, b) {
  const aTime = a?.timestamp ? Date.parse(a.timestamp) : 0;
  const bTime = b?.timestamp ? Date.parse(b.timestamp) : 0;
  return bTime - aTime;
}

function getPostType({ mediaType, mediaProductType, mediaCount, permalink }) {
  if (mediaCount > 1 || mediaType === "CAROUSEL_ALBUM") return "carousel";
  if (mediaProductType === "REELS") return "reel";
  if (typeof permalink === "string" && permalink.includes("/reel/")) return "reel";
  if (mediaType === "VIDEO") return "video";
  return "image";
}

async function cacheThumb(media, previousMedia) {
  const existingRelativePath = previousMedia && previousMedia.thumb_path;
  const existingAbsolutePath = existingRelativePath
    ? path.join(repoRoot, existingRelativePath.replace(/^\/+/, ""))
    : null;

  if (
    previousFeed.cache_version === cacheVersion &&
    existingAbsolutePath &&
    await fileExists(existingAbsolutePath)
  ) {
    return existingRelativePath;
  }

  const response = await fetch(media.thumbUrl);

  if (!response.ok) {
    throw new Error(`Failed to download media thumb ${media.id} (${response.status}).`);
  }

  const contentType = response.headers.get("content-type") || "";
  const sourceExtension = getExtensionFromContentType(contentType);
  const targetExtension = useMagick ? ".webp" : sourceExtension;
  const relativePath = `/img/instagram-cache/${media.id}${targetExtension}`;
  const absolutePath = path.join(repoRoot, relativePath.replace(/^\/+/, ""));
  const buffer = Buffer.from(await response.arrayBuffer());

  if (useMagick) {
    const tempSourcePath = path.join(cacheDir, `${media.id}${sourceExtension}`);

    await fs.writeFile(tempSourcePath, buffer);

    const resizeResult = spawnSync(
      "magick",
      [
        tempSourcePath,
        "-auto-orient",
        "-strip",
        "-resize",
        "1600x2000>",
        "-quality",
        "82",
        absolutePath
      ],
      {
        stdio: "pipe",
        windowsHide: true
      }
    );

    await fs.rm(tempSourcePath, { force: true });

    if (resizeResult.status !== 0) {
      throw new Error(`ImageMagick failed for ${media.id}: ${resizeResult.stderr.toString("utf8")}`);
    }

    return relativePath;
  }

  await fs.writeFile(absolutePath, buffer);
  return relativePath;
}

async function removeStaleCacheFiles(keepRelativePaths) {
  const keepAbsolutePaths = new Set(
    Array.from(keepRelativePaths, (relativePath) =>
      path.join(repoRoot, relativePath.replace(/^\/+/, ""))
    )
  );

  const entries = await fs.readdir(cacheDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (entry.name === ".gitkeep") continue;

    const absolutePath = path.join(cacheDir, entry.name);

    if (!keepAbsolutePaths.has(absolutePath)) {
      await fs.rm(absolutePath, { force: true });
    }
  }
}

function getExtensionFromContentType(contentType) {
  if (contentType.includes("png")) return ".png";
  if (contentType.includes("webp")) return ".webp";
  return ".jpg";
}

async function readJson(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    return {
      items: []
    };
  }
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

function sanitizeId(value) {
  return String(value).replace(/[^a-zA-Z0-9_-]+/g, "-");
}

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
