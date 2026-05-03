jest.mock("axios", () => ({
  get: jest.fn(),
}));

jest.mock("dns", () => ({
  promises: {
    lookup: jest.fn(),
  },
}));

const axios = require("axios");
const dns = require("dns");
const { fetchImageFromUrl } = require("../src/services/urlFetchService");
const { AppError } = require("../src/utils/errors");

describe("upload-url SSRF hardening", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects localhost before any DNS or HTTP request", async () => {
    await expect(fetchImageFromUrl("http://localhost/image.jpg")).rejects.toThrow(
      AppError
    );

    expect(dns.promises.lookup).not.toHaveBeenCalled();
    expect(axios.get).not.toHaveBeenCalled();
  });

  it.each([
    "http://127.0.0.1/image.jpg",
    "http://10.0.0.1/image.jpg",
    "http://172.16.0.1/image.jpg",
    "http://192.168.1.1/image.jpg",
    "http://169.254.169.254/image.jpg",
    "http://[::1]/image.jpg",
  ])("rejects private host %s before fetch", async (url) => {
    await expect(fetchImageFromUrl(url)).rejects.toThrow(AppError);

    expect(dns.promises.lookup).not.toHaveBeenCalled();
    expect(axios.get).not.toHaveBeenCalled();
  });

  it("rejects hostnames that resolve to private IPs", async () => {
    dns.promises.lookup.mockResolvedValue([{ address: "10.0.0.5", family: 4 }]);

    await expect(fetchImageFromUrl("https://example.com/image.jpg")).rejects.toThrow(
      /private/i
    );

    expect(dns.promises.lookup).toHaveBeenCalledWith("example.com", {
      all: true,
      verbatim: true,
    });
    expect(axios.get).not.toHaveBeenCalled();
  });

  it("downloads only after validating resolved public IPs", async () => {
    dns.promises.lookup.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
    axios.get.mockResolvedValue({
      status: 200,
      headers: { "content-type": "image/jpeg; charset=binary" },
      data: Buffer.from("image-bytes"),
    });

    const result = await fetchImageFromUrl("https://example.com/image.jpg");

    expect(result.buffer.equals(Buffer.from("image-bytes"))).toBe(true);
    expect(result.contentType).toBe("image/jpeg");
    expect(axios.get).toHaveBeenCalledWith(
      "https://example.com/image.jpg",
      expect.objectContaining({
        maxRedirects: 0,
        timeout: expect.any(Number),
        maxContentLength: expect.any(Number),
        maxBodyLength: expect.any(Number),
      })
    );
    const axiosOptions = axios.get.mock.calls[0][1];
    expect(axiosOptions.lookup).toEqual(expect.any(Function));
    await expect(
      new Promise((resolve, reject) => {
        axiosOptions.lookup("example.com", {}, (err, address, family) => {
          if (err) {
            reject(err);
            return;
          }
          resolve({ address, family });
        });
      })
    ).resolves.toEqual({ address: "93.184.216.34", family: 4 });
  });

  it("rejects redirect responses", async () => {
    dns.promises.lookup.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
    axios.get.mockResolvedValue({
      status: 302,
      headers: { location: "http://127.0.0.1/image.jpg", "content-type": "image/jpeg" },
      data: Buffer.from("redirect"),
    });

    await expect(fetchImageFromUrl("https://example.com/image.jpg")).rejects.toThrow(
      /redirect/i
    );
  });
});
