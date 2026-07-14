import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CampaignWizardState } from "@/lib/types/campaign";

export function useCampaignWizard(campaignId: string) {
  const [state,   setState]   = useState<CampaignWizardState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("admin_get_campaign_wizard_state", {
        p_campaign_id: campaignId,
      });
      if (error) throw new Error(error.message);
      setState(data as CampaignWizardState);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar campanha");
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => { load(); }, [load]);

  const saveStep = useCallback(async (step: number, data: Record<string, unknown>): Promise<boolean> => {
    if (!state) return false;
    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: result, error } = await supabase.rpc("admin_update_campaign_step", {
        p_campaign_id: campaignId,
        p_step: step,
        p_data: data,
        p_version: state.campaign.version,
      });
      if (error) throw new Error(error.message);
      const { new_version } = result as { new_version: number };
      setState(prev => prev
        ? { ...prev, campaign: { ...prev.campaign, version: new_version } }
        : prev);
      await load();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
      return false;
    } finally {
      setSaving(false);
    }
  }, [campaignId, state, load]);

  const publish = useCallback(async (): Promise<{ ok: boolean; status: string } | false> => {
    if (!state) return false;
    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: result, error } = await supabase.rpc("admin_publish_campaign", {
        p_campaign_id: campaignId,
        p_version: state.campaign.version,
      });
      if (error) throw new Error(error.message);
      await load();
      return result as { ok: boolean; status: string };
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao publicar");
      return false;
    } finally {
      setSaving(false);
    }
  }, [campaignId, state, load]);

  return { state, loading, saving, error, setError, saveStep, publish, reload: load };
}
