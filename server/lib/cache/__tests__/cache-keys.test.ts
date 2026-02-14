/**
 * Tests for server/lib/cache/cache-keys.ts
 * Coverage target: 100%
 */
import { describe, expect, it } from "vitest";
import { CacheKeys, InvalidationPatterns } from "../cache-keys";

describe("CacheKeys", () => {
  describe("homepage", () => {
    it("should generate batch key", () => {
      expect(CacheKeys.homepage.batch()).toBe("homepage:batch");
    });

    it("should generate hero key", () => {
      expect(CacheKeys.homepage.hero()).toBe("homepage:hero");
    });

    it("should generate slogans key", () => {
      expect(CacheKeys.homepage.slogans()).toBe("homepage:slogans");
    });

    it("should generate sections key", () => {
      expect(CacheKeys.homepage.sections()).toBe("homepage:sections");
    });

    it("should generate processCards key", () => {
      expect(CacheKeys.homepage.processCards()).toBe("homepage:process_cards");
    });

    it("should generate sustainability key", () => {
      expect(CacheKeys.homepage.sustainability()).toBe("homepage:sustainability");
    });

    it("should generate featuredProducts key", () => {
      expect(CacheKeys.homepage.featuredProducts()).toBe("homepage:featured_products");
    });
  });

  describe("media", () => {
    it("should generate asset key with id", () => {
      expect(CacheKeys.media.asset(123)).toBe("media:asset:123");
    });

    it("should generate asset key with different id", () => {
      expect(CacheKeys.media.asset(456)).toBe("media:asset:456");
    });

    it("should generate batch key with sorted ids", () => {
      expect(CacheKeys.media.batch([3, 1, 2])).toBe("media:batch:1,2,3");
    });

    it("should generate batch key with single id", () => {
      expect(CacheKeys.media.batch([5])).toBe("media:batch:5");
    });

    it("should generate batch key with empty array", () => {
      expect(CacheKeys.media.batch([])).toBe("media:batch:");
    });

    it("should generate paginated key", () => {
      expect(CacheKeys.media.paginated(10, 0)).toBe("media:assets:10:0");
    });

    it("should generate paginated key with different values", () => {
      expect(CacheKeys.media.paginated(20, 40)).toBe("media:assets:20:40");
    });

    it("should generate variants key", () => {
      expect(CacheKeys.media.variants(123, "webp")).toBe("media:variants:123:webp");
    });

    it("should generate variants key with complex options", () => {
      expect(CacheKeys.media.variants(456, "w=800&h=600")).toBe("media:variants:456:w=800&h=600");
    });
  });

  describe("products", () => {
    it("should generate list key without filters", () => {
      expect(CacheKeys.products.list()).toBe("products:list");
    });

    it("should generate list key with filters", () => {
      expect(CacheKeys.products.list("category=activewear")).toBe(
        "products:list:category=activewear",
      );
    });

    it("should generate summary key", () => {
      expect(CacheKeys.products.summary(10, 0)).toBe("products:summary:10:0");
    });

    it("should generate summary key with different values", () => {
      expect(CacheKeys.products.summary(20, 40)).toBe("products:summary:20:40");
    });

    it("should generate item key", () => {
      expect(CacheKeys.products.item(123)).toBe("products:item:123");
    });

    it("should generate related key", () => {
      expect(CacheKeys.products.related(123)).toBe("products:related:123");
    });

    it("should generate categories key", () => {
      expect(CacheKeys.products.categories()).toBe("products:categories");
    });

    it("should generate totalCount key", () => {
      expect(CacheKeys.products.totalCount()).toBe("products:total_count");
    });
  });

  describe("navigation", () => {
    it("should generate items key", () => {
      expect(CacheKeys.navigation.items()).toBe("navigation:items");
    });

    it("should generate settings key", () => {
      expect(CacheKeys.navigation.settings()).toBe("navigation:settings");
    });
  });

  describe("about", () => {
    it("should generate batch key", () => {
      expect(CacheKeys.about.batch()).toBe("about:batch");
    });

    it("should generate hero key", () => {
      expect(CacheKeys.about.hero()).toBe("about:hero");
    });

    it("should generate timeline key", () => {
      expect(CacheKeys.about.timeline()).toBe("about:timeline");
    });

    it("should generate locations key", () => {
      expect(CacheKeys.about.locations()).toBe("about:locations");
    });

    it("should generate sections key", () => {
      expect(CacheKeys.about.sections()).toBe("about:sections");
    });

    it("should generate statistics key", () => {
      expect(CacheKeys.about.statistics()).toBe("about:statistics");
    });

    it("should generate teamMessage key", () => {
      expect(CacheKeys.about.teamMessage()).toBe("about:team_message");
    });
  });

  describe("sustainability", () => {
    it("should generate batch key", () => {
      expect(CacheKeys.sustainability.batch()).toBe("sustainability:batch");
    });

    it("should generate hero key", () => {
      expect(CacheKeys.sustainability.hero()).toBe("sustainability:hero");
    });

    it("should generate metrics key", () => {
      expect(CacheKeys.sustainability.metrics()).toBe("sustainability:metrics");
    });

    it("should generate fabrics key", () => {
      expect(CacheKeys.sustainability.fabrics()).toBe("sustainability:fabrics");
    });

    it("should generate unified key", () => {
      expect(CacheKeys.sustainability.unified()).toBe("sustainability:unified");
    });
  });

  describe("manufacturing", () => {
    it("should generate batch key", () => {
      expect(CacheKeys.manufacturing.batch()).toBe("manufacturing:batch");
    });

    it("should generate hero key", () => {
      expect(CacheKeys.manufacturing.hero()).toBe("manufacturing:hero");
    });

    it("should generate processes key", () => {
      expect(CacheKeys.manufacturing.processes()).toBe("manufacturing:processes");
    });
  });

  describe("technology", () => {
    it("should generate batch key", () => {
      expect(CacheKeys.technology.batch()).toBe("technology:batch");
    });

    it("should generate hero key", () => {
      expect(CacheKeys.technology.hero()).toBe("technology:hero");
    });

    it("should generate innovations key", () => {
      expect(CacheKeys.technology.innovations()).toBe("technology:innovations");
    });

    it("should generate gradientSettings key", () => {
      expect(CacheKeys.technology.gradientSettings()).toBe("technology:gradient_settings");
    });
  });

  describe("contact", () => {
    it("should generate configuration key", () => {
      expect(CacheKeys.contact.configuration()).toBe("contact:configuration");
    });

    it("should generate inquiries key", () => {
      expect(CacheKeys.contact.inquiries()).toBe("contact:inquiries");
    });
  });

  describe("footer", () => {
    it("should generate config key", () => {
      expect(CacheKeys.footer.config()).toBe("footer:config");
    });
  });

  describe("inquiries", () => {
    it("should generate list key without params", () => {
      expect(CacheKeys.inquiries.list()).toBe("inquiries:list");
    });

    it("should generate list key with page only", () => {
      expect(CacheKeys.inquiries.list(1)).toBe("inquiries:list:page=1");
    });

    it("should generate list key with page and limit", () => {
      expect(CacheKeys.inquiries.list(2, 20)).toBe("inquiries:list:page=2:limit=20");
    });

    it("should generate list key with status", () => {
      expect(CacheKeys.inquiries.list(1, 10, "pending")).toBe(
        "inquiries:list:page=1:limit=10:status=pending",
      );
    });

    it("should generate list key with source", () => {
      expect(CacheKeys.inquiries.list(1, 10, "pending", "website")).toBe(
        "inquiries:list:page=1:limit=10:status=pending:source=website",
      );
    });

    it("should generate list key with search", () => {
      expect(CacheKeys.inquiries.list(1, 10, "pending", "website", "test")).toBe(
        "inquiries:list:page=1:limit=10:status=pending:source=website:search=test",
      );
    });

    it("should ignore empty status string", () => {
      expect(CacheKeys.inquiries.list(1, 10, "")).toBe("inquiries:list:page=1:limit=10");
    });

    it("should ignore empty source string", () => {
      expect(CacheKeys.inquiries.list(1, 10, "pending", "")).toBe(
        "inquiries:list:page=1:limit=10:status=pending",
      );
    });

    it("should ignore empty search string", () => {
      expect(CacheKeys.inquiries.list(1, 10, "pending", "website", "")).toBe(
        "inquiries:list:page=1:limit=10:status=pending:source=website",
      );
    });

    it("should generate detail key", () => {
      expect(CacheKeys.inquiries.detail(123)).toBe("inquiries:detail:123");
    });

    it("should generate stats key", () => {
      expect(CacheKeys.inquiries.stats()).toBe("inquiries:stats");
    });
  });

  describe("fabrics", () => {
    it("should generate list key", () => {
      expect(CacheKeys.fabrics.list()).toBe("fabrics:list");
    });

    it("should generate item key", () => {
      expect(CacheKeys.fabrics.item(123)).toBe("fabrics:item:123");
    });
  });

  describe("fibers", () => {
    it("should generate list key", () => {
      expect(CacheKeys.fibers.list()).toBe("fibers:list");
    });

    it("should generate item key", () => {
      expect(CacheKeys.fibers.item(123)).toBe("fibers:item:123");
    });
  });

  describe("certificates", () => {
    it("should generate list key", () => {
      expect(CacheKeys.certificates.list()).toBe("certificates:list");
    });

    it("should generate item key", () => {
      expect(CacheKeys.certificates.item(123)).toBe("certificates:item:123");
    });
  });

  describe("sizeCharts", () => {
    it("should generate list key", () => {
      expect(CacheKeys.sizeCharts.list()).toBe("size_charts:list");
    });

    it("should generate item key", () => {
      expect(CacheKeys.sizeCharts.item(123)).toBe("size_charts:item:123");
    });
  });

  describe("accessories", () => {
    it("should generate list key", () => {
      expect(CacheKeys.accessories.list()).toBe("accessories:list");
    });

    it("should generate item key", () => {
      expect(CacheKeys.accessories.item(123)).toBe("accessories:item:123");
    });
  });

  describe("computed", () => {
    it("should generate query key", () => {
      expect(CacheKeys.computed.query("abc123")).toBe("computed:query:abc123");
    });

    it("should generate batch key", () => {
      expect(CacheKeys.computed.batch("products", "hash123")).toBe(
        "computed:batch:products:hash123",
      );
    });
  });
});

describe("InvalidationPatterns", () => {
  it("should have homepage pattern", () => {
    expect(InvalidationPatterns.homepage).toBe("^homepage:.*");
  });

  it("should have media pattern", () => {
    expect(InvalidationPatterns.media).toBe("^media:.*");
  });

  it("should have products pattern", () => {
    expect(InvalidationPatterns.products).toBe("^products:.*");
  });

  it("should have navigation pattern", () => {
    expect(InvalidationPatterns.navigation).toBe("^navigation:.*");
  });

  it("should have about pattern", () => {
    expect(InvalidationPatterns.about).toBe("^about:.*");
  });

  it("should have sustainability pattern", () => {
    expect(InvalidationPatterns.sustainability).toBe("^sustainability:.*");
  });

  it("should have manufacturing pattern", () => {
    expect(InvalidationPatterns.manufacturing).toBe("^manufacturing:.*");
  });

  it("should have technology pattern", () => {
    expect(InvalidationPatterns.technology).toBe("^technology:.*");
  });

  it("should have contact pattern", () => {
    expect(InvalidationPatterns.contact).toBe("^contact:.*");
  });

  it("should have inquiries pattern", () => {
    expect(InvalidationPatterns.inquiries).toBe("^inquiries:.*");
  });

  it("should have fabrics pattern", () => {
    expect(InvalidationPatterns.fabrics).toBe("^fabrics:.*");
  });

  it("should have fibers pattern", () => {
    expect(InvalidationPatterns.fibers).toBe("^fibers:.*");
  });

  it("should have certificates pattern", () => {
    expect(InvalidationPatterns.certificates).toBe("^certificates:.*");
  });

  it("should have sizeCharts pattern", () => {
    expect(InvalidationPatterns.sizeCharts).toBe("^size_charts:.*");
  });

  it("should have accessories pattern", () => {
    expect(InvalidationPatterns.accessories).toBe("^accessories:.*");
  });

  it("should have computed pattern", () => {
    expect(InvalidationPatterns.computed).toBe("^computed:.*");
  });

  describe("regex matching", () => {
    it("should match homepage keys", () => {
      const pattern = new RegExp(InvalidationPatterns.homepage);
      expect(pattern.test("homepage:hero")).toBe(true);
      expect(pattern.test("homepage:batch")).toBe(true);
      expect(pattern.test("homepage:sections")).toBe(true);
      expect(pattern.test("products:list")).toBe(false);
    });

    it("should match media keys", () => {
      const pattern = new RegExp(InvalidationPatterns.media);
      expect(pattern.test("media:asset:123")).toBe(true);
      expect(pattern.test("media:batch:1,2,3")).toBe(true);
      expect(pattern.test("homepage:hero")).toBe(false);
    });

    it("should match products keys", () => {
      const pattern = new RegExp(InvalidationPatterns.products);
      expect(pattern.test("products:list")).toBe(true);
      expect(pattern.test("products:item:123")).toBe(true);
      expect(pattern.test("products:categories")).toBe(true);
      expect(pattern.test("media:asset:123")).toBe(false);
    });

    it("should match inquiries keys", () => {
      const pattern = new RegExp(InvalidationPatterns.inquiries);
      expect(pattern.test("inquiries:list")).toBe(true);
      expect(pattern.test("inquiries:detail:123")).toBe(true);
      expect(pattern.test("inquiries:stats")).toBe(true);
      expect(pattern.test("products:list")).toBe(false);
    });
  });
});
