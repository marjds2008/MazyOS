// Draw Engine — Test suite
// Tests: determinism, zero collisions, uniform distribution, sub-1ms performance

import { DrawEngine, NumberGenerator, AuditService, SeedManager } from "../engine";

const TEST_SEED = "deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef";

// ── Determinism ───────────────────────────────────────────────

describe("determinism", () => {
  test("same seed + sequence always produces same number", () => {
    for (let i = 1; i <= 100; i++) {
      const a = NumberGenerator.generate(TEST_SEED, i);
      const b = NumberGenerator.generate(TEST_SEED, i);
      expect(a).toBe(b);
    }
  });

  test("same seed + different sequences produce different numbers", () => {
    const n1 = NumberGenerator.generate(TEST_SEED, 1);
    const n2 = NumberGenerator.generate(TEST_SEED, 2);
    expect(n1).not.toBe(n2);
  });

  test("different seeds + same sequence produce different numbers", () => {
    const seed2 = "cafebabecafebabecafebabecafebabecafebabecafebabecafebabecafebabe";
    const n1 = NumberGenerator.generate(TEST_SEED, 1);
    const n2 = NumberGenerator.generate(seed2, 1);
    expect(n1).not.toBe(n2);
  });
});

// ── Domain ────────────────────────────────────────────────────

describe("domain", () => {
  test("all generated numbers are in [0, 99999]", () => {
    for (let i = 1; i <= 1000; i++) {
      const n = NumberGenerator.generate(TEST_SEED, i);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThanOrEqual(99999);
    }
  });

  test("format always returns 5-char string", () => {
    const cases = [0, 1, 100, 9999, 42000, 99999];
    for (const n of cases) {
      const f = NumberGenerator.format(n);
      expect(f).toHaveLength(5);
      expect(/^\d{5}$/.test(f)).toBe(true);
    }
  });
});

// ── Zero collisions (100k sequences) ─────────────────────────

describe("zero collisions", () => {
  test("100k sequences produce 100k unique numbers", () => {
    const seen = new Set<number>();
    for (let i = 1; i <= 100_000; i++) {
      const n = NumberGenerator.generate(TEST_SEED, i);
      if (seen.has(n)) {
        throw new Error(`Collision at sequence ${i}: number ${n} already seen`);
      }
      seen.add(n);
    }
    expect(seen.size).toBe(100_000);
  }, 60_000); // 60s timeout for 100k iterations
});

// ── Uniform distribution ─────────────────────────────────────

describe("distribution", () => {
  test("numbers spread across full range [0, 99999]", () => {
    const SAMPLE = 10_000;
    const BUCKETS = 10;
    const buckets = new Array(BUCKETS).fill(0);
    const bucketSize = 100_000 / BUCKETS;

    for (let i = 1; i <= SAMPLE; i++) {
      const n = NumberGenerator.generate(TEST_SEED, i);
      const bucket = Math.floor(n / bucketSize);
      buckets[Math.min(bucket, BUCKETS - 1)]++;
    }

    const expected = SAMPLE / BUCKETS;
    const tolerance = 0.15; // ±15%

    for (const count of buckets) {
      expect(count).toBeGreaterThan(expected * (1 - tolerance));
      expect(count).toBeLessThan(expected * (1 + tolerance));
    }
  });
});

// ── Performance ───────────────────────────────────────────────

describe("performance", () => {
  test("generates 1000 numbers in under 1 second (avg < 1ms each)", () => {
    const start = Date.now();
    for (let i = 1; i <= 1_000; i++) {
      NumberGenerator.generate(TEST_SEED, i);
    }
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(1_000);
  });
});

// ── Audit / hash ─────────────────────────────────────────────

describe("audit", () => {
  test("hash is deterministic", () => {
    const h1 = AuditService.generateHash(TEST_SEED, 1, 42000);
    const h2 = AuditService.generateHash(TEST_SEED, 1, 42000);
    expect(h1).toBe(h2);
  });

  test("different inputs produce different hashes", () => {
    const h1 = AuditService.generateHash(TEST_SEED, 1, 42000);
    const h2 = AuditService.generateHash(TEST_SEED, 2, 42000);
    expect(h1).not.toBe(h2);
  });

  test("hash verification works", () => {
    const n = NumberGenerator.generate(TEST_SEED, 5);
    const h = AuditService.generateHash(TEST_SEED, 5, n);
    expect(AuditService.verifyHash(TEST_SEED, 5, n, h)).toBe(true);
    expect(AuditService.verifyHash(TEST_SEED, 5, n + 1, h)).toBe(false);
  });

  test("hash is 64 hex chars (SHA256)", () => {
    const h = AuditService.generateHash(TEST_SEED, 1, 12345);
    expect(h).toHaveLength(64);
    expect(/^[0-9a-f]{64}$/.test(h)).toBe(true);
  });
});

// ── DrawEngine facade ─────────────────────────────────────────

describe("DrawEngine facade", () => {
  test("generateForParticipant returns all fields", () => {
    const result = DrawEngine.generateForParticipant(TEST_SEED, 1);
    expect(result.sequence).toBe(1);
    expect(result.displayNumber).toBeGreaterThanOrEqual(0);
    expect(result.displayNumber).toBeLessThanOrEqual(99999);
    expect(result.formatted).toHaveLength(5);
    expect(result.displayHash).toHaveLength(64);
  });

  test("verify returns correct result", () => {
    const { displayNumber } = DrawEngine.generateForParticipant(TEST_SEED, 7);
    const ok  = DrawEngine.verify(TEST_SEED, 7, displayNumber);
    const bad = DrawEngine.verify(TEST_SEED, 7, (displayNumber + 1) % 100_000);
    expect(ok.valid).toBe(true);
    expect(bad.valid).toBe(false);
  });
});

// ── SeedManager ───────────────────────────────────────────────

describe("SeedManager", () => {
  test("generates 64-char hex seed", () => {
    const seed = SeedManager.generate();
    expect(seed).toHaveLength(64);
    expect(/^[0-9a-f]{64}$/.test(seed)).toBe(true);
  });

  test("two seeds are never equal", () => {
    const s1 = SeedManager.generate();
    const s2 = SeedManager.generate();
    expect(s1).not.toBe(s2);
  });

  test("hash is deterministic", () => {
    expect(SeedManager.hash(TEST_SEED)).toBe(SeedManager.hash(TEST_SEED));
  });
});
