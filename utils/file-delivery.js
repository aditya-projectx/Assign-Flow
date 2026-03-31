function sanitizeFilename(name) {
  return String(name || "assignment")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function getExtensionFromUrl(url) {
  try {
    const pathname = new URL(url).pathname;
    const lastSegment = pathname.split("/").pop() || "";
    const match = lastSegment.match(/\.([a-z0-9]+)$/i);
    return match ? match[1].toLowerCase() : null;
  } catch {
    return null;
  }
}

function buildFetchCandidates(fileUrl) {
  const candidates = [fileUrl];

  if (fileUrl.includes("/raw/upload/")) {
    candidates.push(fileUrl.replace("/raw/upload/", "/image/upload/"));
  }

  if (fileUrl.includes("/image/upload/")) {
    candidates.push(fileUrl.replace("/image/upload/", "/raw/upload/"));
  }

  if (/\.[a-z0-9]+$/i.test(fileUrl)) {
    candidates.push(fileUrl.replace(/\.[a-z0-9]+$/i, ""));
  }

  return [...new Set(candidates)];
}

export async function streamRemoteFile(
  res,
  fileUrl,
  baseName,
  mode = "inline",
  options = {}
) {
  const candidates = buildFetchCandidates(fileUrl);
  let response;
  let resolvedUrl = fileUrl;
  let lastStatus;

  for (const candidate of candidates) {
    const candidateResponse = await fetch(candidate);
    if (candidateResponse.ok) {
      response = candidateResponse;
      resolvedUrl = candidate;
      break;
    }

    lastStatus = candidateResponse.status;
  }

  if (!response) {
    throw new Error(`Remote file fetch failed with status ${lastStatus || 404}`);
  }

  const fileBuffer = Buffer.from(await response.arrayBuffer());
  const extension = options.extension || getExtensionFromUrl(resolvedUrl) || "pdf";
  const filename = `${sanitizeFilename(baseName)}.${extension}`;
  const contentType =
    options.contentType ||
    response.headers.get("content-type") ||
    (extension === "pdf" ? "application/pdf" : "application/octet-stream");

  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Length", fileBuffer.length);
  res.setHeader(
    "Content-Disposition",
    `${mode}; filename="${filename}"`
  );

  res.send(fileBuffer);
}
