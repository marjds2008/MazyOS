export type CampaignStatus   = 'draft' | 'upcoming' | 'scheduled' | 'active' | 'ended' | 'cancelled';
export type CampaignSegment  = 'turismo' | 'restaurante' | 'clinica' | 'comercio' | 'servicos' | 'evento' | 'outro';
export type CampaignType     = 'sorteio' | 'promocao' | 'vale_compra' | 'evento' | 'fidelidade' | 'indicacao' | 'cashback' | 'outro';
export type DrawMethod       = 'loteria_federal' | 'interno' | 'plataforma_externa' | 'manual' | 'outro';
export type LandingTheme     = 'natureza' | 'serra' | 'praia' | 'premium' | 'familiar' | 'minimalista' | 'corporativo' | 'sazonal';
export type SectionType      = 'confianca' | 'hero' | 'form' | 'countdown' | 'social_proof' | 'como_funciona' |
                               'premio' | 'itens_incluidos' | 'galeria' | 'roteiro' | 'parceiros' |
                               'depoimentos' | 'regulamento' | 'faq' | 'seguranca' | 'rodape';

export interface Campaign {
  id: string;
  title: string;
  public_name: string | null;
  slug: string;
  status: CampaignStatus;
  company: string | null;
  segment: CampaignSegment | null;
  campaign_type: CampaignType | null;
  objective: string | null;
  target_audience: string | null;
  internal_description: string | null;
  internal_owner: string | null;
  prize_name: string | null;
  prize_description: string | null;
  prize_value: number | null;
  winners_count: number;
  currency: string;
  draw_method: DrawMethod | null;
  start_date: string | null;
  end_date: string | null;
  draw_date: string | null;
  announcement_date: string | null;
  participant_limit: number | null;
  timezone: string;
  regulation_url: string | null;
  regulation_version: string | null;
  is_main_campaign: boolean;
  current_wizard_step: number;
  version: number;
  template_id: string | null;
  template_version: number | null;
  instagram_url: string | null;
  official_post_url: string | null;
  participant_count: number;
  updated_at: string;
  created_at: string;
}

export interface LandingSettings {
  template_id: string | null;
  template_version: number | null;
  theme: LandingTheme | null;
  headline: string | null;
  subheadline: string | null;
  cta_text: string;
  cta_color: string | null;
  primary_color: string;
  secondary_color: string;
  background_color: string | null;
  logo_url: string | null;
  hero_image_url: string | null;
  hero_image_mobile_url: string | null;
  hero_image_alt: string | null;
  badge_text: string | null;
  microcopy: string | null;
}

export interface CampaignSection {
  id: string;
  section_type: SectionType;
  is_active: boolean;
  display_order: number;
  content: Record<string, unknown>;
}

export interface CampaignTask {
  id: string;
  name: string;
  description: string;
  action_key: string;
  required: boolean;
  reward_numbers: number;
  display_order: number;
  active: boolean;
  verification_type: 'manual' | 'automatic';
}

export interface CampaignPartner {
  partner_id: string;
  name: string;
  instagram: string | null;
  logo: string | null;
  category: string | null;
}

export interface AutomationSettings {
  automation_enabled: boolean;
  sender_instance: string | null;
  official_instagram: string | null;
  official_post_url: string | null;
  required_mentions: number;
  allowed_send_start: string;
  allowed_send_end: string;
  retry_limit: number;
  retry_interval_minutes: number;
  welcome_message: string | null;
  lucky_number_message: string | null;
  missions_message: string | null;
  pending_message: string | null;
  reminder_message: string | null;
  validated_message: string | null;
  campaign_ended_message: string | null;
  winner_message: string | null;
  non_winner_message: string | null;
}

export interface MarketingSettings {
  seo_title: string | null;
  seo_description: string | null;
  canonical_url: string | null;
  robots_directive: string;
  og_title: string | null;
  og_description: string | null;
  og_image_url: string | null;
  og_type: string;
  pixel_id: string | null;
  pixel_events: Record<string, boolean>;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  internal_code: string | null;
}

export interface ChecklistItem {
  step: number;
  field: string;
  label: string;
  required: boolean;
  ok: boolean;
}

export interface CampaignWizardState {
  campaign: Campaign;
  landing_settings: LandingSettings;
  sections: CampaignSection[];
  tasks: CampaignTask[];
  partners: CampaignPartner[];
  automation: AutomationSettings;
  marketing: MarketingSettings;
  checklist: { ok: boolean; items: ChecklistItem[]; can_publish: boolean };
}

export interface CampaignListItem {
  id: string;
  title: string;
  public_name: string | null;
  slug: string;
  company: string | null;
  segment: CampaignSegment | null;
  campaign_type: CampaignType | null;
  status: CampaignStatus;
  is_main_campaign: boolean;
  start_date: string | null;
  end_date: string | null;
  draw_date: string | null;
  participant_count: number;
  current_wizard_step: number;
  template_name: string | null;
  updated_at: string;
}
