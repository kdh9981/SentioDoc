// Preset tags for quick application

export interface TagPreset {
  name: string;
  emoji: string;
  color: string;
  category: 'link' | 'contact' | 'both';
}

// Preset tags - shown to all users as quick-apply options
export const TAG_PRESETS: TagPreset[] = [
  // Link presets
  { name: 'Sales Deck', emoji: '📊', color: 'blue', category: 'link' },
  { name: 'Case Study', emoji: '📋', color: 'green', category: 'link' },
  { name: 'Proposal', emoji: '💼', color: 'purple', category: 'link' },
  { name: 'Active', emoji: '🚀', color: 'green', category: 'link' },
  { name: 'Archived', emoji: '📁', color: 'slate', category: 'link' },
  { name: 'Internal', emoji: '🔒', color: 'slate', category: 'link' },

  // Contact presets
  { name: 'Hot Lead', emoji: '🔥', color: 'red', category: 'contact' },
  { name: 'VIP', emoji: '⭐', color: 'amber', category: 'contact' },
  { name: 'Follow Up', emoji: '📞', color: 'blue', category: 'contact' },
  { name: 'Prospect', emoji: '💰', color: 'green', category: 'contact' },
  { name: 'Customer', emoji: '🤝', color: 'purple', category: 'contact' },
  { name: 'Partner', emoji: '🏢', color: 'indigo', category: 'contact' },
];

// Color options for custom tags
export const TAG_COLORS = [
  { name: 'red', bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  { name: 'orange', bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
  { name: 'amber', bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  { name: 'green', bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  { name: 'blue', bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  { name: 'purple', bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
  { name: 'indigo', bg: 'bg-indigo-100', text: 'text-indigo-700', dot: 'bg-indigo-500' },
  { name: 'slate', bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-500' },
];

// Popular emojis for tag creation
export const TAG_EMOJIS = [
  '🏷️', '⭐', '🔥', '💼', '📊', '📋', '🚀', '💰',
  '🎯', '📞', '🤝', '🏢', '📁', '🔒', '✅', '❌',
  '🇰🇷', '🇺🇸', '🇯🇵', '🌍', '📈', '📉', '💡', '🎨',
];

// Helper to get color classes
export function getTagColorClasses(color: string): { bg: string; text: string; dot: string } {
  return TAG_COLORS.find(c => c.name === color) || TAG_COLORS[4]; // Default to blue
}

// Helper to get presets by category
export function getPresetsForCategory(category: 'link' | 'contact'): TagPreset[] {
  return TAG_PRESETS.filter(p => p.category === category || p.category === 'both');
}
