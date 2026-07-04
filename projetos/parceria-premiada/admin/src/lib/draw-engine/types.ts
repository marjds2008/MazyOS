// Draw Engine — Type definitions
// Version: 2.0

export const DRAW_ENGINE_VERSION = "2.0";
export const ALGORITHM_VERSION   = "v1";
export const DOMAIN              = 100_000; // [0, 99999]

// ─── Core interfaces ─────────────────────────────────────────

export interface GenerateResult {
  sequence:      number;
  displayNumber: number;
  displayHash:   string;
  formatted:     string; // zero-padded 5-digit string
}

export interface VerifyResult {
  valid:         boolean;
  seed:          string;
  sequence:      number;
  expected:      number;
  provided:      number;
  hashMatch:     boolean;
  algorithmVersion: string;
}

export interface AuditInfo {
  seed:               string;
  seedHash:           string;
  algorithmVersion:   string;
  drawEngineVersion:  string;
  totalIssued:        number;
  firstNumber:        number | null;
  lastNumber:         number | null;
  createdAt:          string;
}

export interface CampaignSeed {
  seed:              string;
  seedHash:          string;
  algorithmVersion:  string;
  drawEngineVersion: string;
  createdAt:         Date;
}

// ─── Lottery provider interfaces (future) ────────────────────

export interface LotteryProvider {
  name:        string;
  description: string;
  minNumber:   number;
  maxNumber:   number;
  validate(number: number): boolean;
  formatNumber(number: number): string;
}

export interface LotteryResult {
  drawnNumbers: number[];
  drawDate:     Date;
  drawCode:     string;
  provider:     string;
}

export interface FederalLotteryProvider extends LotteryProvider {
  federalDraw: number;
  prize:       string;
}

export interface MegaSenaProvider extends LotteryProvider {
  contestNumber: number;
  accumulation:  boolean;
}

// ─── Winner resolver interface (future) ─────────────────────

export interface WinnerCandidate {
  participantId:  string;
  displayNumber:  number;
  sequence:       number;
  displayHash:    string;
}

export interface WinnerResolution {
  winner:        WinnerCandidate | null;
  drawnNumber:   number;
  resolvedAt:    Date;
  drawCode:      string;
  auditProof:    string;
}

export interface WinnerResolver {
  resolveWinner(
    campaignId:  string,
    drawnNumber: number,
    drawCode:    string,
  ): Promise<WinnerResolution>;
}

// ─── Algorithm versions registry ─────────────────────────────

export type AlgorithmVersionId = "v1"; // extend for v2, v3...

export interface AlgorithmSpec {
  version:     AlgorithmVersionId;
  description: string;
  domain:      number;
  space:       number;
  rounds:      number;
  hashFn:      string;
}

export const ALGORITHM_SPECS: Record<AlgorithmVersionId, AlgorithmSpec> = {
  v1: {
    version:     "v1",
    description: "Unbalanced Feistel (8+9 bits) over 2^17 space, cycle-walk to 10^5 domain, HMAC-SHA256 round function",
    domain:      100_000,
    space:       131_072, // 2^17
    rounds:      8,
    hashFn:      "HMAC-SHA256",
  },
};
