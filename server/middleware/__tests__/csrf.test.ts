import { beforeEach, describe, expect, it, vi } from "vitest";
import { csrfProtection, csrfTokenGenerator, csrfValidator } from "../csrf";

vi.mock("../lib/monitoring/logger.js", () => ({
  logger: {
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe("CSRF Middleware", () => {
  let req: Record<string, unknown> & {
    cookies: Record<string, string>;
    get: ReturnType<typeof vi.fn>;
    method: string;
    path: string;
    headers: Record<string, string>;
  };
  let res: {
    cookie: ReturnType<typeof vi.fn>;
    locals: Record<string, unknown>;
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
  };
  let next: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      cookies: {},
      get: vi.fn(),
      method: "GET",
      path: "/api/test",
      headers: {},
    };
    res = {
      cookie: vi.fn(),
      locals: {},
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
  });

  describe("csrfTokenGenerator", () => {
    it("sets a new token if one doesn't exist", () => {
      csrfTokenGenerator(req, res, next);
      expect(res.cookie).toHaveBeenCalledWith("csrf_token", expect.any(String), expect.any(Object));
      expect(res.locals.csrfToken).toBeDefined();
      expect(next).toHaveBeenCalled();
    });

    it("uses existing token if present", () => {
      req.cookies.csrf_token = "existing-token";
      csrfTokenGenerator(req, res, next);
      expect(res.cookie).not.toHaveBeenCalled();
      expect(res.locals.csrfToken).toBe("existing-token");
      expect(next).toHaveBeenCalled();
    });

    it("bypasses if _skipCsrf is true", () => {
      req._skipCsrf = true;
      csrfTokenGenerator(req, res, next);
      expect(res.cookie).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });

  describe("csrfValidator", () => {
    it("allows GET requests without validation", () => {
      req.method = "GET";
      csrfValidator(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("allows excluded routes", () => {
      req.method = "POST";
      req.path = "/api/health";
      csrfValidator(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("rejects POST with missing tokens", () => {
      req.method = "POST";
      csrfValidator(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: "CSRF_TOKEN_MISSING" }),
      );
    });

    it("rejects mismatched tokens", () => {
      req.method = "POST";
      req.cookies.csrf_token = "token1";
      req.get.mockReturnValue("token2");
      csrfValidator(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: "CSRF_TOKEN_INVALID" }),
      );
    });

    it("allows matching tokens", () => {
      const token = "a".repeat(64); // Need same length for timingSafeEqual
      req.method = "POST";
      req.cookies.csrf_token = token;
      req.get.mockReturnValue(token);
      csrfValidator(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe("csrfProtection", () => {
    it("calls generator and then validator", () => {
      const token = "a".repeat(64);
      req.method = "POST";
      req.cookies.csrf_token = token;
      req.get.mockReturnValue(token);

      csrfProtection(req, res, next);

      expect(res.locals.csrfToken).toBe(token);
      expect(next).toHaveBeenCalled();
    });
  });
});
