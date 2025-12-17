export enum ViewState {
  LANDING = 'LANDING',
  DASHBOARD = 'DASHBOARD'
}

// UTM Template type
export interface UTMTemplate {
  id: string;
  link_id: string;
  user_id: string;
  name: string;
  utm_source: string;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  created_at: string;
  updated_at: string;
}

// Link Preview type
export interface LinkPreview {
  og_title: string | null;
  og_description: string | null;
  og_image_type: 'default' | 'custom' | 'logo';
  og_image_url: string | null;
}

// Link Settings type
export interface LinkSettings {
  require_name: boolean;
  require_email: boolean;
  allow_download: boolean;
  password: string;
  expiration_date: string;
  notes: string;
  // Link Preview
  og_title: string;
  og_description: string;
  og_image_type: 'default' | 'custom' | 'logo';
  og_image_url: string;
}

// Tier limits
export const UTM_LIMITS = {
  free: 5,
  starter: 15,
  pro: 30
} as const;

export const LINK_PREVIEW_ACCESS = {
  free: false,      // Cannot customize
  starter: true,    // Can customize
  pro: true         // Can customize
} as const;

// Quick setup platforms
export const UTM_PLATFORMS = [
  { id: 'twitter', name: 'Twitter', icon: '🐦', utm_source: 'twitter', utm_medium: 'social' },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼', utm_source: 'linkedin', utm_medium: 'social' },
  { id: 'facebook', name: 'Facebook', icon: '📘', utm_source: 'facebook', utm_medium: 'social' },
  { id: 'instagram', name: 'Instagram', icon: '📸', utm_source: 'instagram', utm_medium: 'social' },
  { id: 'email', name: 'Email', icon: '📧', utm_source: 'email', utm_medium: 'email' },
  { id: 'slack', name: 'Slack', icon: '💬', utm_source: 'slack', utm_medium: 'messaging' },
  { id: 'whatsapp', name: 'WhatsApp', icon: '📱', utm_source: 'whatsapp', utm_medium: 'messaging' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵', utm_source: 'tiktok', utm_medium: 'social' },
] as const;

export type UserTier = 'free' | 'starter' | 'pro';
