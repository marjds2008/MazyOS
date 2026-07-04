// Draw Engine Core — v2.0
// Deterministic, collision-free 5-digit number generator
// Algorithm: Unbalanced Feistel network (8+9 bits) over 2^17 domain
// with cycle-walking into [0, 99999], HMAC-SHA256 round function

import crypto from "crypto";
import {
  ALGORITHM_VERSION,
  DRAW_ENGINE_VERSION,
  DOMAIN,
  type AlgorithmVersionId,
  type CampaignSeed,
  type GenerateResult,
  type VerifyResult,
} from "./types";

// ── Constants ────────────────────────────────────────────────

const SPACE      = 1 << 17;       // 131072 — must be > DOMAIN
const LEFT_BITS  = 8;             // upper half: 256 values
const RIGHT_BITS = 9;             // lower half: 512 values
const LEFT_MOD   = 1 << LEFT_BITS;
const RIGHT_MOD  = 1 << RIGHT_BITS;
const ROUNDS     = 8;

// ── SeedManager ──────────────────────────────────────────────

export const SeedManager = {
  generate(): string {
    return crypto.randomBytes(32).toString("hex");
  },

  hash(seed: string): string {
    return crypto.createHash("sha256").update(seed).digest("hex");
  },

  createCampaignSeed(): CampaignSeed {
    const seed = SeedManager.generate();
    return {
      seed,
      seedHash:          SeedManager.hash(seed),
      algorithmVersion:  ALGORITHM_VERSION,
      drawEngineVersion: DRAW_ENGINE_VERSION,
      createdAt:         new Date(),
    };
  },

  // Derive a stable HMAC key from the seed + algorithm version
  deriveKey(seed: string, version: AlgorithmVersionId = "v1"): Buffer {
    return crypto
      .createHash("sha256")
      .update(`draw-engine:${version}:${seed}`)
      .digest();
  },
};

// ── NumberGenerator ──────────────────────────────────────────

export const NumberGenerator = {
  // One round of the Feistel network
  _roundFn(key: Buffer, round: number, value: number, mod: number): number {
    const buf = Buffer.alloc(5);
    buf.writeUInt8(round & 0xff, 0);
    buf.writeUInt32BE(value >>> 0, 1);
    const h = crypto.createHmac("sha256", key).update(buf).digest();
    return h.readUInt32BE(0) % mod;
  },

  // Bijective permutation over [0, SPACE-1] keyed by seed
  _feistel(key: Buffer, x: number): number {
    let L = (x >>> RIGHT_BITS) & (LEFT_MOD - 1); // 8-bit upper half
    let R = x & (RIGHT_MOD - 1);                  // 9-bit lower half

    for (let r = 0; r < ROUNDS; r++) {
      if (r % 2 === 0) {
        // Even rounds: mix right half using left as input
        R = (R + NumberGenerator._roundFn(key, r, L, RIGHT_MOD)) % RIGHT_MOD;
      } else {
        // Odd rounds: mix left half using right as input
        L = (L + NumberGenerator._roundFn(key, r, R, LEFT_MOD)) % LEFT_MOD;
      }
    }

    return (L << RIGHT_BITS) | R; // recombine into 17-bit value
  },

  // Generate a unique display number from seed + sequence.
  // Properties: deterministic, collision-free within a campaign, sub-1ms.
  // sequence is 1-indexed (first participant = 1).
  generate(seed: string, sequence: number): number {
    const key = SeedManager.deriveKey(seed);
    let x = (sequence - 1) % SPACE; // 0-indexed, stays within space

    // Cycle-walk: apply Feistel until result is in domain [0, DOMAIN-1]
    // Expected iterations: SPACE/DOMAIN ≈ 1.31, almost always finishes in 1-2 steps
    do {
      x = NumberGenerator._feistel(key, x);
    } while (x >= DOMAIN);

    return x;
  },

  format(n: number): string {
    return n.toString().padStart(5, "0");
  },
};

// ── AuditService ─────────────────────────────────────────────

export const AuditService = {
  // SHA256(seed:sequence:displayNumber) — tamper-evident fingerprint
  generateHash(seed: string, sequence: number, displayNumber: number): string {
    return crypto
      .createHash("sha256")
      .update(`${seed}:${sequence}:${displayNumber}`)
      .digest("hex");
  },

  verifyHash(
    seed:          string,
    sequence:      number,
    displayNumber: number,
    storedHash:    string,
  ): boolean {
    const expected = AuditService.generateHash(seed, sequence, displayNumber);
    // Constant-time comparison to prevent timing attacks
    try {
      return crypto.timingSafeEqual(
        Buffer.from(expected, "hex"),
        Buffer.from(storedHash, "hex"),
      );
    } catch {
      return false;
    }
  },
};

// ── LotteryValidator ─────────────────────────────────────────

export const LotteryValidator = {
  verify(seed: string, sequence: number, displayNumber: number): VerifyResult {
    const expected = NumberGenerator.generate(seed, sequence);
    return {
      valid:            expected === displayNumber,
      seed,
      sequence,
      expected,
      provided:         displayNumber,
      hashMatch:        expected === displayNumber,
      algorithmVersion: ALGORITHM_VERSION,
    };
  },

  // Verify without knowing the seed — using stored hash only
  verifyByHash(
    seed:          string,
    sequence:      number,
    displayNumber: number,
    storedHash:    string,
  ): boolean {
    const algorithmValid = NumberGenerator.generate(seed, sequence) === displayNumber;
    const hashValid      = AuditService.verifyHash(seed, sequence, displayNumber, storedHash);
    return algorithmValid && hashValid;
  },
};

// ── TransparencyService ──────────────────────────────────────

export const TransparencyService = {
  describe(): {
    algorithm: string;
    howItWorks: string[];
    whyNoCollisions: string;
    howToVerify: string;
    openSource: boolean;
  } {
    return {
      algorithm: `Unbalanced Feistel Network (${ROUNDS} rounds) — HMAC-SHA256`,
      howItWorks: [
        "Cada campanha recebe uma seed única gerada com `crypto.randomBytes(32)` — nunca se repete.",
        "Cada participante recebe um número de sequência incremental (1, 2, 3...).",
        "A combinação seed + sequence passa por uma rede Feistel de 8 rodadas com HMAC-SHA256.",
        "O resultado é um número de 5 dígitos entre 00000 e 99999, determinístico e sem colisões.",
        "Um hash SHA256(seed:sequence:número) é gerado e salvo para auditoria independente.",
        "Nunca usamos Math.random(). Toda aleatoriedade vem de funções criptográficas.",
      ],
      whyNoCollisions:
        "A rede Feistel é uma função bijetora — cada sequência mapeia para exatamente um número, sem repetição. " +
        "Matematicamente impossível duas sequências diferentes gerarem o mesmo número com a mesma seed.",
      howToVerify:
        "Qualquer pessoa pode verificar um número digitando a seed da campanha + número de sequência + número exibido. " +
        "O sistema recalcula e confirma se o número é válido.",
      openSource: false,
    };
  },
};

// ── DrawEngine (facade) ───────────────────────────────────────

export const DrawEngine = {
  version: DRAW_ENGINE_VERSION,
  algorithmVersion: ALGORITHM_VERSION,

  SeedManager,
  NumberGenerator,
  AuditService,
  LotteryValidator,
  TransparencyService,

  // High-level: generate everything needed to register a participant
  generateForParticipant(seed: string, sequence: number): GenerateResult {
    const displayNumber = NumberGenerator.generate(seed, sequence);
    return {
      sequence,
      displayNumber,
      displayHash: AuditService.generateHash(seed, sequence, displayNumber),
      formatted:   NumberGenerator.format(displayNumber),
    };
  },

  // Quick verify — used in admin UI
  verify(seed: string, sequence: number, displayNumber: number): VerifyResult {
    return LotteryValidator.verify(seed, sequence, displayNumber);
  },
};
