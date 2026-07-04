"use client";

import { useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export function useAudit() {
  return useCallback(async (
    action: string,
    resource?: string,
    metadata?: Record<string, unknown>
  ) => {
    try {
      const supabase = createClient();
      await supabase.rpc("log_admin_action", {
        p_action:   action,
        p_resource: resource ?? null,
        p_metadata: metadata ?? null,
      });
    } catch {
      // fire-and-forget
    }
  }, []);
}
