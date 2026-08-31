import { err, ok } from "neverthrow";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getMediaContent, getThumbnail } from "../../server/routes/media/handlers";
import { mediaService } from "../../server/services/media/media.service";

// We need to mock mediaService
vi.mock("../../server/services/media/media.service", () => ({
  mediaService: {
    getSignedUrl: vi.fn(),
    getThumbnailUrl: vi.fn(),
  },
}));

describe("media-handlers", () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    req = { params: { id: "1" }, query: {} };
    res = {
      set: vi.fn(),
      redirect: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };
    vi.clearAllMocks();
  });

  it("getMediaContent returns signed url on success", async () => {
    vi.mocked(mediaService.getSignedUrl).mockResolvedValue(ok("http://signed.url") as any);
    await getMediaContent(req, res);
    expect(res.set).toHaveBeenCalledWith("Cache-Control", "public, max-age=300");
    expect(res.redirect).toHaveBeenCalledWith(302, "http://signed.url");
  });

  it("getMediaContent returns transparent gif on 404", async () => {
    const notFoundErr: any = new Error("NotFound");
    notFoundErr.name = "NotFoundError";
    vi.mocked(mediaService.getSignedUrl).mockResolvedValue(err(notFoundErr) as any);
    await getMediaContent(req, res);
    expect(res.set).toHaveBeenCalledWith("Content-Type", "image/gif");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalled();
  });

  it("getThumbnail returns signed url on success", async () => {
    vi.mocked(mediaService.getThumbnailUrl).mockResolvedValue(ok("http://thumb.url") as any);
    await getThumbnail(req, res);
    expect(res.set).toHaveBeenCalledWith("Cache-Control", "public, max-age=300");
    expect(res.redirect).toHaveBeenCalledWith(302, "http://thumb.url");
  });

  it("getThumbnail returns transparent gif on 404", async () => {
    const notFoundErr: any = new Error("NotFound");
    notFoundErr.statusCode = 404;
    vi.mocked(mediaService.getThumbnailUrl).mockResolvedValue(err(notFoundErr) as any);
    await getThumbnail(req, res);
    expect(res.set).toHaveBeenCalledWith("Content-Type", "image/gif");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalled();
  });
});
