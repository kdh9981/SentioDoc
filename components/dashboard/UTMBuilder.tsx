'use client';

import React, { useState, useEffect, useMemo } from 'react';

interface UTMBuilderProps {
  baseUrl: string;
  onUrlChange?: (url: string) => void;
}

interface UTMPreset {
  id: string;
  name: string;
  source: string;
  medium: string;
  campaign: string;
}

const DEFAULT_PRESETS: UTMPreset[] = [
  { id: 'linkedin', name: 'LinkedIn Post', source: 'linkedin', medium: 'social', campaign: '' },
  { id: 'twitter', name: 'Twitter/X Post', source: 'twitter', medium: 'social', campaign: '' },
  { id: 'email', name: 'Email Campaign', source: 'email', medium: 'email', campaign: '' },
  { id: 'newsletter', name: 'Newsletter', source: 'newsletter', medium: 'email', campaign: '' },
  { id: 'facebook', name: 'Facebook Post', source: 'facebook', medium: 'social', campaign: '' },
  { id: 'google_ads', name: 'Google Ads', source: 'google', medium: 'cpc', campaign: '' },
  { id: 'direct_outreach', name: 'Direct Outreach', source: 'outreach', medium: 'direct', campaign: '' },
  { id: 'slack', name: 'Slack Share', source: 'slack', medium: 'message', campaign: '' },
];

export default function UTMBuilder({ baseUrl, onUrlChange }: UTMBuilderProps) {
  const [source, setSource] = useState('');
  const [medium, setMedium] = useState('');
  const [campaign, setCampaign] = useState('');
  const [content, setContent] = useState('');
  const [term, setTerm] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [copied, setCopied] = useState(false);

  // Build the full URL with UTM parameters
  const fullUrl = useMemo(() => {
    const url = new URL(baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`);

    if (source) url.searchParams.set('utm_source', source);
    if (medium) url.searchParams.set('utm_medium', medium);
    if (campaign) url.searchParams.set('utm_campaign', campaign);
    if (content) url.searchParams.set('utm_content', content);
    if (term) url.searchParams.set('utm_term', term);

    return url.toString();
  }, [baseUrl, source, medium, campaign, content, term]);

  // Notify parent of URL changes
  useEffect(() => {
    onUrlChange?.(fullUrl);
  }, [fullUrl, onUrlChange]);

  const handlePresetClick = (preset: UTMPreset) => {
    setSource(preset.source);
    setMedium(preset.medium);
    if (preset.campaign) setCampaign(preset.campaign);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const clearAll = () => {
    setSource('');
    setMedium('');
    setCampaign('');
    setContent('');
    setTerm('');
  };

  const hasParams = source || medium || campaign || content || term;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800">UTM Builder</h3>
            <p className="text-sm text-slate-600 mt-0.5">Track where your views come from</p>
          </div>
          {hasParams && (
            <button
              onClick={clearAll}
              className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">close</span>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Quick Presets */}
      <div className="px-6 py-4 border-b border-slate-100">
        <p className="text-xs font-semibold text-slate-600 tracking-wide mb-3">Quick presets</p>
        <div className="flex flex-wrap gap-2">
          {DEFAULT_PRESETS.map(preset => (
            <button
              key={preset.id}
              onClick={() => handlePresetClick(preset)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                source === preset.source && medium === preset.medium
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* UTM Parameters */}
      <div className="px-6 py-4 space-y-4">
        {/* Required Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Source <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
              placeholder="e.g., linkedin, email"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm"
            />
            <p className="text-xs text-slate-500 mt-1">Where traffic comes from</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Medium <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={medium}
              onChange={(e) => setMedium(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
              placeholder="e.g., social, email, cpc"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm"
            />
            <p className="text-xs text-slate-500 mt-1">Marketing channel type</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Campaign</label>
            <input
              type="text"
              value={campaign}
              onChange={(e) => setCampaign(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
              placeholder="e.g., q4_launch, black_friday"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm"
            />
            <p className="text-xs text-slate-500 mt-1">Campaign name</p>
          </div>
        </div>

        {/* Advanced Parameters */}
        <div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-800"
          >
            <span className="material-symbols-outlined text-sm">
              {showAdvanced ? 'expand_less' : 'expand_more'}
            </span>
            {showAdvanced ? 'Hide' : 'Show'} advanced options
          </button>

          {showAdvanced && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Content</label>
                <input
                  type="text"
                  value={content}
                  onChange={(e) => setContent(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                  placeholder="e.g., header_cta, sidebar_banner"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm"
                />
                <p className="text-xs text-slate-500 mt-1">A/B test variant or ad content</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Term</label>
                <input
                  type="text"
                  value={term}
                  onChange={(e) => setTerm(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                  placeholder="e.g., keyword_1, target_audience"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm"
                />
                <p className="text-xs text-slate-500 mt-1">Paid search keywords</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Generated URL */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
        <p className="text-xs font-semibold text-slate-600 tracking-wide mb-2">Generated URL</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-white rounded-lg border border-slate-200 px-3 py-2 overflow-hidden">
            <code className="text-sm text-slate-700 break-all">{fullUrl}</code>
          </div>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
              copied
                ? 'bg-green-500 text-white'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            <span className="material-symbols-outlined text-lg">
              {copied ? 'check' : 'content_copy'}
            </span>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* UTM Tips */}
      <div className="px-6 py-4 bg-blue-50 border-t border-blue-100">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-blue-500">lightbulb</span>
          <div className="text-sm text-blue-800">
            <p className="font-semibold">Pro Tip</p>
            <p className="mt-1">Use consistent naming conventions across campaigns. For example, always use &quot;linkedin&quot; instead of mixing &quot;LinkedIn&quot;, &quot;li&quot;, or &quot;linkedin.com&quot;.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact version for inline use
export function UTMBuilderCompact({ baseUrl }: { baseUrl: string }) {
  const [source, setSource] = useState('');
  const [medium, setMedium] = useState('');
  const [campaign, setCampaign] = useState('');
  const [copied, setCopied] = useState(false);

  const fullUrl = useMemo(() => {
    const url = new URL(baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`);
    if (source) url.searchParams.set('utm_source', source);
    if (medium) url.searchParams.set('utm_medium', medium);
    if (campaign) url.searchParams.set('utm_campaign', campaign);
    return url.toString();
  }, [baseUrl, source, medium, campaign]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <input
          type="text"
          value={source}
          onChange={(e) => setSource(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
          placeholder="Source"
          className="px-2 py-1.5 rounded-lg border border-slate-200 text-sm"
        />
        <input
          type="text"
          value={medium}
          onChange={(e) => setMedium(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
          placeholder="Medium"
          className="px-2 py-1.5 rounded-lg border border-slate-200 text-sm"
        />
        <input
          type="text"
          value={campaign}
          onChange={(e) => setCampaign(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
          placeholder="Campaign"
          className="px-2 py-1.5 rounded-lg border border-slate-200 text-sm"
        />
      </div>
      <div className="flex items-center gap-2">
        <code className="flex-1 text-xs bg-slate-100 px-2 py-1.5 rounded-lg truncate">{fullUrl}</code>
        <button
          onClick={handleCopy}
          className={`p-1.5 rounded-lg ${copied ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'}`}
        >
          <span className="material-symbols-outlined text-sm">{copied ? 'check' : 'content_copy'}</span>
        </button>
      </div>
    </div>
  );
}
