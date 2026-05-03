const axios = require("axios");
const dns = require("dns").promises;
const net = require("net");
const { URL } = require("url");
const config = require("../config/config");
const { AppError } = require("../utils/errors");
const { isPrivateIp, normalizeContentType } = require("../utils/network");

async function resolveAndValidateHost(hostname) {
  const normalizedHost = hostname.replace(/^\[(.*)\]$/, "$1");
  const literalFamily = net.isIP(normalizedHost);
  if (literalFamily) {
    if (isPrivateIp(normalizedHost)) {
      throw new AppError("Private or local URLs are not allowed", 400);
    }

    return [{ address: normalizedHost, family: literalFamily }];
  }

  const records = await dns.lookup(normalizedHost, { all: true, verbatim: true });
  if (!records || records.length === 0) {
    throw new AppError("Unable to resolve image host", 400);
  }

  const privateRecord = records.find((record) => isPrivateIp(record.address));
  if (privateRecord) {
    throw new AppError("Private or local URLs are not allowed", 400);
  }

  return records;
}

async function fetchImageFromUrl(rawUrl) {
  const url = new URL(rawUrl);

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new AppError("Only HTTP and HTTPS URLs are allowed", 400);
  }

  if (url.username || url.password) {
    throw new AppError("Credentials in URL are not allowed", 400);
  }

  const hostname = url.hostname.toLowerCase();
  const normalizedHostname = hostname.replace(/^\[(.*)\]$/, "$1");
  if (["localhost"].includes(normalizedHostname) || isPrivateIp(normalizedHostname)) {
    throw new AppError("Private or local URLs are not allowed", 400);
  }

  const resolvedRecords = await resolveAndValidateHost(normalizedHostname);
  const primaryRecord = resolvedRecords[0];

  const response = await axios.get(rawUrl, {
    responseType: "arraybuffer",
    timeout: config.axios.timeout,
    maxContentLength: config.axios.maxContentLength,
    maxBodyLength: config.axios.maxBodyLength,
    maxRedirects: 0,
    headers: {
      "User-Agent": "Text-Over-Image-API/1.0",
    },
    lookup: (hostnameToResolve, options, callback) => {
      if (hostnameToResolve !== hostname) {
        callback(new AppError("Unexpected hostname during lookup", 400));
        return;
      }

      callback(null, primaryRecord.address, primaryRecord.family);
    },
    validateStatus: () => true,
  });

  const contentType = normalizeContentType(response.headers["content-type"]);
  if (!config.upload.allowedMimeTypes.includes(contentType)) {
    throw new AppError(
      "Invalid image format from URL. Only JPG, PNG, and WebP are allowed.",
      400
    );
  }

  const statusCode = response.status;
  if (statusCode >= 300 && statusCode < 400) {
    throw new AppError("Redirects are not allowed for image URLs", 400);
  }

  return {
    buffer: Buffer.from(response.data),
    contentType,
    sourceUrl: rawUrl,
  };
}

module.exports = {
  fetchImageFromUrl,
};
