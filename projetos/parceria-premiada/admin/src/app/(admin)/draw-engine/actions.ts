"use server";

import { DrawEngine } from "@/lib/draw-engine";

export async function serverGenerateSeed() {
  return DrawEngine.SeedManager.createCampaignSeed();
}

export async function serverVerifyNumber(
  seed: string,
  sequence: number,
  displayNumber: number
) {
  return DrawEngine.verify(seed, sequence, displayNumber);
}
