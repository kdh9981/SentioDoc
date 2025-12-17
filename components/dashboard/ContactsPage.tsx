'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PeriodSelector from './PeriodSelector';
import UpgradeModal from './UpgradeModal';
import { usePeriodFilter, Tier } from '@/hooks/usePeriodFilter';
import { InfoTooltip } from '@/components/ui/Tooltip';
import { getMetricDefinition } from '@/lib/metric-definitions';
import TagFilter from '@/components/ui/TagFilter';
import TagBadge from '@/components/ui/TagBadge';

interface Contact {
  id: string;
  name: string;
  email: string;
  company?: string;
  total_views: number;
  avg_engagement: number;
  is_hot_lead: boolean;
  first_seen_at: string;
  last_seen_at: string;
  total_time_seconds?: number;
  files_viewed?: string[];
  has_downloaded?: boolean;
  tags?: string[];
}

interface FileInfo {
  id: string;
  name: string;
}

interface CompanyData {
  name: string;
  viewers: Contact[];
  totalVisits: number;
  avgEngagement: number;
  filesViewed: Set<string>;
}

type IntentFilter = 'all' | 'hot' | 'warm' | 'cold';
type ActionFilter = 'downloaded' | 'return';
type ViewMode = 'individual' | 'company';
type SortField = 'name' | 'company' | 'engagement' | 'visits' | 'files' | 'lastSeen';
type SortOrder = 'asc' | 'desc';

interface ContactInsight {
  icon: string;
  text: string;
  implication: string;
}

interface ContactAction {
  icon: string;
  title: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  actionType: string;
  data?: string;
}

// Helper functions
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return '1d ago';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getInitials(name: string): string {
  if (!name || name === 'Anonymous') return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function IntentBadge({ score }: { score: number }) {
  if (score >= 70) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
        🔥 {Math.round(score)}
      </span>
    );
  }
  if (score >= 40) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
        🟡 {Math.round(score)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
      ⚪ {Math.round(score)}
    </span>
  );
}

// Sortable Header Component
function SortableHeader({
  label,
  field,
  currentField,
  currentOrder,
  onSort,
  className = '',
}: {
  label: string;
  field: SortField;
  currentField: SortField;
  currentOrder: SortOrder;
  onSort: (field: SortField) => void;
  className?: string;
}) {
  const isActive = currentField === field;
  return (
    <th
      className={`pb-3 px-4 font-medium cursor-pointer hover:bg-slate-50 transition-colors select-none ${className}`}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        <span>{label}</span>
        {isActive && (
          <span className="text-blue-500">{currentOrder === 'desc' ? '↓' : '↑'}</span>
        )}
      </div>
    </th>
  );
}

function groupByCompany(contacts: Contact[]): Record<string, Contact[]> {
  const groups: Record<string, Contact[]> = {};
  contacts.forEach(contact => {
    const company = contact.company || 'Unknown';
    if (!groups[company]) groups[company] = [];
    groups[company].push(contact);
  });
  return groups;
}

function groupContactsByCompany(contacts: Contact[]): CompanyData[] {
  const companies: Record<string, CompanyData> = {};

  contacts.forEach(contact => {
    let company = contact.company;
    if (!company && contact.email) {
      const domain = contact.email.split('@')[1];
      if (domain) {
        const domainName = domain.split('.')[0].toLowerCase();
        if (['gmail', 'yahoo', 'hotmail', 'outlook', 'icloud', 'aol', 'protonmail'].includes(domainName)) {
          company = 'Other';
        } else {
          company = domainName.charAt(0).toUpperCase() + domainName.slice(1);
        }
      }
    }

    if (!company || company.toLowerCase() === 'unknown') {
      company = 'Other';
    }

    if (!companies[company]) {
      companies[company] = {
        name: company,
        viewers: [],
        totalVisits: 0,
        avgEngagement: 0,
        filesViewed: new Set()
      };
    }

    companies[company].viewers.push(contact);
    companies[company].totalVisits += contact.total_views || 0;

    contact.files_viewed?.forEach(fileId => {
      companies[company].filesViewed.add(fileId);
    });
  });

  Object.values(companies).forEach(company => {
    const totalEng = company.viewers.reduce((sum, v) => sum + (v.avg_engagement || 0), 0);
    company.avgEngagement = Math.round(totalEng / company.viewers.length);
  });

  return Object.values(companies)
    .filter(c => c.name !== 'Other')
    .sort((a, b) => b.viewers.length - a.viewers.length);
}

function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return Math.round(numbers.reduce((a, b) => a + b, 0) / numbers.length);
}

function generateContactsInsights(contacts: Contact[]): ContactInsight[] {
  const insights: ContactInsight[] = [];

  const hotLeads = contacts.filter(c => c.is_hot_lead || c.avg_engagement >= 70);
  if (hotLeads.length > 0) {
    insights.push({
      icon: '🔥',
      text: `${hotLeads.length} hot lead${hotLeads.length > 1 ? 's' : ''} ready for immediate follow-up`,
      implication: 'High intent viewers - prioritize outreach'
    });
  }

  const companies = groupByCompany(contacts);
  Object.entries(companies).forEach(([company, viewers]) => {
    if (viewers.length >= 2 && company !== 'Unknown') {
      const avgEng = average(viewers.map(v => v.avg_engagement));
      insights.push({
        icon: '🏢',
        text: `${company} team (${viewers.length} people) showing strong interest`,
        implication: avgEng >= 70 ? 'Potential deal opportunity' : 'Monitoring your content'
      });
    }
  });

  const firstTime = contacts.filter(c => c.total_views === 1);
  const returning = contacts.filter(c => c.total_views > 1);
  const firstTimePercent = contacts.length > 0
    ? Math.round((firstTime.length / contacts.length) * 100)
    : 0;

  if (contacts.length > 0) {
    insights.push({
      icon: '👤',
      text: `${firstTimePercent}% of contacts are first-time viewers`,
      implication: returning.length > 0
        ? `${returning.length} returning contacts show ongoing interest`
        : 'Focus on converting first impressions'
    });
  }

  return insights.slice(0, 4);
}

function generateContactActions(contacts: Contact[]): ContactAction[] {
  const actions: ContactAction[] = [];

  const hotLeads = contacts
    .filter(c => c.is_hot_lead || c.avg_engagement >= 70)
    .slice(0, 3);

  hotLeads.forEach(lead => {
    actions.push({
      icon: '🔥',
      title: `Follow up with ${lead.name || 'Hot Lead'}`,
      reason: `${Math.round(lead.avg_engagement)}% engagement, viewed ${lead.files_viewed?.length || 1} files`,
      priority: 'high',
      actionType: 'email',
      data: lead.email,
    });
  });

  const returnVisitors = contacts
    .filter(c => c.total_views > 2 && !c.is_hot_lead && c.avg_engagement < 70)
    .slice(0, 2);

  returnVisitors.forEach(visitor => {
    actions.push({
      icon: '🔄',
      title: `Re-engage ${visitor.name || 'Return Visitor'}`,
      reason: `${visitor.total_views} visits, showing continued interest`,
      priority: 'medium',
      actionType: 'email',
      data: visitor.email,
    });
  });

  const companies = groupByCompany(contacts);
  Object.entries(companies).forEach(([company, viewers]) => {
    if (viewers.length >= 2 && company !== 'Unknown') {
      actions.push({
        icon: '🏢',
        title: `Engage ${company} team`,
        reason: `${viewers.length} team members viewing your content`,
        priority: 'medium',
        actionType: 'company',
        data: company,
      });
    }
  });

  return actions.slice(0, 5);
}

// Contact Row Component with fixed tooltips
function ContactRow({
  contact,
  isHot = false,
  onClick,
  tags = [],
}: {
  contact: Contact;
  isHot?: boolean;
  onClick: () => void;
  tags?: Array<{ id: string; name: string; emoji: string; color: string }>;
}) {
  const isReturnVisitor = contact.total_views > 1;
  const hasMultipleFiles = (contact.files_viewed?.length || 0) > 1;

  return (
    <tr
      className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
      onClick={onClick}
    >
      {/* Name */}
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {contact.name ? getInitials(contact.name) : '❓'}
          </div>
          <div>
            <div className="font-medium text-slate-900">
              {contact.name || 'Anonymous'}
            </div>
            {contact.email && (
              <div className="text-sm text-slate-500">{contact.email}</div>
            )}
          </div>
        </div>
      </td>

      {/* Company */}
      <td className="py-4 px-4 text-slate-600">
        {contact.company || '—'}
      </td>

      {/* Engagement */}
      <td className="py-4 px-4">
        <IntentBadge score={contact.avg_engagement} />
      </td>

      {/* Visits */}
      <td className="py-4 px-4 text-slate-600">
        {contact.total_views}x
      </td>

      {/* Files */}
      {isHot && (
        <td className="py-4 px-4 text-slate-600">
          {contact.files_viewed?.length || 0}
        </td>
      )}

      {/* Last Seen */}
      <td className="py-4 px-4 text-slate-500">
        {formatRelativeTime(contact.last_seen_at)}
      </td>

      {/* Tags */}
      <td className="py-4 px-4">
        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 3).map(tag => (
            <TagBadge key={tag.id} name={tag.name} emoji={tag.emoji} color={tag.color} size="sm" />
          ))}
          {tags.length > 3 && (
            <span className="text-xs text-slate-500">+{tags.length - 3}</span>
          )}
        </div>
      </td>

      {/* Action Icons with Tooltips */}
      <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex gap-2 items-center">
          {/* Email Button */}
          <a
            href={`mailto:${contact.email}`}
            className="group relative p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs text-white bg-slate-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[9999]">
              Email {contact.email}
            </span>
          </a>

          {/* Return Visitor Badge */}
          {isReturnVisitor && (
            <span className="group relative p-1.5 rounded-lg bg-purple-50 text-purple-600 cursor-default">
              <span className="text-sm">🔄</span>
              {contact.total_views > 1 && (
                <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {contact.total_views}
                </span>
              )}
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs text-white bg-slate-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[9999]">
                Return visitor ({contact.total_views}x)
              </span>
            </span>
          )}

          {/* Downloaded Badge */}
          {contact.has_downloaded && (
            <span className="group relative p-1.5 rounded-lg bg-green-50 text-green-600 cursor-default">
              <span className="text-sm">📥</span>
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs text-white bg-slate-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[9999]">
                Downloaded
              </span>
            </span>
          )}

          {/* Multiple Files Badge */}
          {hasMultipleFiles && (
            <span className="group relative p-1.5 rounded-lg bg-amber-50 text-amber-600 cursor-default">
              <span className="text-sm">📁</span>
              {(contact.files_viewed?.length || 0) > 1 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {contact.files_viewed?.length}
                </span>
              )}
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs text-white bg-slate-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[9999]">
                {contact.files_viewed?.length || 0} files viewed
              </span>
            </span>
          )}
        </div>
      </td>
    </tr>
  );
}

// Company Card Component
function CompanyCard({
  company,
  files,
  onContactClick
}: {
  company: CompanyData;
  files: FileInfo[];
  onContactClick: (id: string) => void;
}) {
  const getCompanyInsight = () => {
    const avgEng = company.avgEngagement;
    const hasMultipleFiles = company.filesViewed.size > 1;
    const hasDownloads = company.viewers.some(v => v.has_downloaded);

    if (avgEng >= 70 && hasDownloads) {
      return 'Active internal sharing, strong interest → Potential deal opportunity';
    }
    if (avgEng >= 70) {
      return 'High engagement across team → Evaluating seriously';
    }
    if (hasMultipleFiles) {
      return 'Reviewing multiple files → Comparing options';
    }
    if (avgEng < 40) {
      return 'Quick review only, low interest → May need different approach';
    }
    return 'Moderate interest → Follow up to gauge intent';
  };

  const getViewedFileNames = (viewer: Contact) => {
    return viewer.files_viewed
      ?.map(fileId => files.find(f => f.id === fileId)?.name)
      .filter(Boolean)
      .slice(0, 3)
      .join(', ') || '';
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">🏢 {company.name}</h3>
            <p className="text-sm text-slate-500 mt-1">
              {company.viewers.length} viewer{company.viewers.length > 1 ? 's' : ''} • {company.totalVisits} total visits • Avg engagement: <IntentBadge score={company.avgEngagement} />
            </p>
          </div>
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            View details →
          </button>
        </div>
      </div>

      <div className="px-6 py-4 space-y-3">
        {company.viewers
          .sort((a, b) => (b.avg_engagement || 0) - (a.avg_engagement || 0))
          .slice(0, 5)
          .map(viewer => (
            <div
              key={viewer.id}
              className="flex items-center gap-4 py-2 hover:bg-slate-50 -mx-2 px-2 rounded-lg cursor-pointer"
              onClick={() => onContactClick(viewer.id)}
            >
              <span className="text-lg">👤</span>
              <span className="font-medium text-slate-900 w-32 truncate">
                {viewer.name || 'Anonymous'}
              </span>
              <IntentBadge score={viewer.avg_engagement || 0} />
              <span className="text-slate-600 text-sm w-12">{viewer.total_views}x</span>
              <span className="text-slate-500 text-sm truncate flex-1">
                {getViewedFileNames(viewer)}
              </span>
            </div>
          ))}

        {company.viewers.length > 5 && (
          <div className="text-sm text-slate-500 pt-2">
            + {company.viewers.length - 5} more viewer{company.viewers.length - 5 > 1 ? 's' : ''}
          </div>
        )}
      </div>

      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
        <p className="text-sm">
          <span className="text-amber-500">💡</span>
          <span className="text-slate-700 ml-2">{getCompanyInsight()}</span>
        </p>
      </div>
    </div>
  );
}

// Company View Component
function CompanyView({
  contacts,
  files,
  onContactClick
}: {
  contacts: Contact[];
  files: FileInfo[];
  onContactClick: (id: string) => void;
}) {
  const companies = groupContactsByCompany(contacts);
  const otherContacts = contacts.filter(c => {
    const company = c.company?.toLowerCase();
    const domain = c.email?.split('@')[1]?.split('.')[0]?.toLowerCase();
    return !company || company === 'unknown' || company === 'other' ||
      ['gmail', 'yahoo', 'hotmail', 'outlook', 'icloud', 'aol', 'protonmail'].includes(domain || '');
  });

  if (companies.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🏢</div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">No companies found</h3>
        <p className="text-slate-600">
          Companies are identified from viewer email domains
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Contacts by company</h2>
        <p className="text-slate-600">
          {companies.length} companies • {contacts.length} total contacts
        </p>
      </div>

      {companies.map(company => (
        <CompanyCard
          key={company.name}
          company={company}
          files={files}
          onContactClick={onContactClick}
        />
      ))}

      {otherContacts.length > 0 && (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-700 mb-2">Other contacts</h3>
          <p className="text-sm text-slate-500 mb-4">
            {otherContacts.length} contacts with personal or unknown email domains
          </p>
          <div className="space-y-2">
            {otherContacts.slice(0, 5).map(viewer => (
              <div
                key={viewer.id}
                className="flex items-center gap-4 py-2 hover:bg-slate-100 rounded-lg px-2 cursor-pointer"
                onClick={() => onContactClick(viewer.id)}
              >
                <span className="w-6">👤</span>
                <span className="font-medium text-slate-700 w-32 truncate">
                  {viewer.name || 'Anonymous'}
                </span>
                <IntentBadge score={viewer.avg_engagement} />
                <span className="text-slate-600">{viewer.total_views}x</span>
              </div>
            ))}
            {otherContacts.length > 5 && (
              <p className="text-sm text-slate-500 pt-2">
                + {otherContacts.length - 5} more
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ContactsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [intentFilter, setIntentFilter] = useState<IntentFilter>('all');
  const [actionFilters, setActionFilters] = useState<ActionFilter[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('individual');
  const [searchQuery, setSearchQuery] = useState('');
  const [exporting, setExporting] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [contactTagsMap, setContactTagsMap] = useState<Record<string, Array<{ id: string; name: string; emoji: string; color: string }>>>({});

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('engagement');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Period filter state
  const [userTier, setUserTier] = useState<Tier>('free');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeRequiredTier, setUpgradeRequiredTier] = useState<Tier>('starter');
  const periodFilter = usePeriodFilter(userTier);

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Toggle action filter
  const toggleActionFilter = (filter: ActionFilter) => {
    setActionFilters(prev =>
      prev.includes(filter)
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  // Fetch user tier
  useEffect(() => {
    async function fetchTier() {
      try {
        const res = await fetch('/api/usage');
        if (res.ok) {
          const data = await res.json();
          setUserTier((data.tier?.toLowerCase() || 'free') as Tier);
        }
      } catch (error) {
        console.error('Failed to fetch tier:', error);
      }
    }
    fetchTier();
  }, []);

  useEffect(() => {
    const view = searchParams.get('view');
    if (view === 'company') {
      setViewMode('company');
    }
  }, [searchParams]);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    const url = new URL(window.location.href);
    if (mode === 'company') {
      url.searchParams.set('view', 'company');
    } else {
      url.searchParams.delete('view');
    }
    window.history.pushState({}, '', url.toString());
  };

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = periodFilter.getApiParams();
      const params = `?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
      const response = await fetch(`/api/contacts${params}`);
      if (!response.ok) throw new Error('Failed to fetch contacts');
      const result = await response.json();

      const parsedContacts = (result.contacts || []).map((contact: Contact) => {
        if (!contact.company && contact.email) {
          const domain = contact.email.split('@')[1];
          if (domain && !['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'].includes(domain)) {
            const companyName = domain.split('.')[0];
            contact.company = companyName.charAt(0).toUpperCase() + companyName.slice(1);
          }
        }
        return contact;
      });

      setContacts(parsedContacts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  }, [periodFilter.effectiveRange]);

  const fetchFiles = useCallback(async () => {
    try {
      const response = await fetch('/api/files');
      if (response.ok) {
        const result = await response.json();
        setFiles((result.files || []).map((f: { id: string; name: string }) => ({
          id: f.id,
          name: f.name
        })));
      }
    } catch (err) {
      console.error('Failed to fetch files:', err);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
    fetchFiles();
  }, [fetchContacts, fetchFiles]);

  useEffect(() => {
    async function fetchContactTags() {
      try {
        const res = await fetch('/api/contacts/with-tags');
        if (res.ok) {
          const data = await res.json();
          setContactTagsMap(data.contactTagsMap || {});
        }
      } catch (error) {
        console.error('Failed to fetch contact tags:', error);
      }
    }
    fetchContactTags();
  }, [contacts]);

  const availableContactTags = useMemo(() => {
    const tagMap = new Map<string, { id: string; name: string; emoji: string; color: string }>();

    Object.values(contactTagsMap).forEach(tags => {
      tags.forEach(tag => {
        if (!tagMap.has(tag.id)) {
          tagMap.set(tag.id, tag);
        }
      });
    });

    return Array.from(tagMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [contactTagsMap]);

  // Count contacts with specific actions for filter badges
  const actionCounts = useMemo(() => {
    return {
      downloaded: contacts.filter(c => c.has_downloaded).length,
      return: contacts.filter(c => c.total_views > 1).length,
    };
  }, [contacts]);

  // Filter and sort contacts
  const filteredContacts = useMemo(() => {
    let filtered = contacts.filter(c => {
      // Intent filter
      if (intentFilter === 'hot' && c.avg_engagement < 70) return false;
      if (intentFilter === 'warm' && (c.avg_engagement < 40 || c.avg_engagement >= 70)) return false;
      if (intentFilter === 'cold' && c.avg_engagement >= 40) return false;

      // Action filters (AND logic - must match all selected)
      if (actionFilters.includes('downloaded') && !c.has_downloaded) return false;
      if (actionFilters.includes('return') && c.total_views <= 1) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchName = c.name?.toLowerCase().includes(query);
        const matchEmail = c.email?.toLowerCase().includes(query);
        const matchCompany = c.company?.toLowerCase().includes(query);
        if (!matchName && !matchEmail && !matchCompany) return false;
      }

      // Tag filter
      if (selectedTagIds.length > 0) {
        const contactTags = contactTagsMap[c.id] || [];
        if (!contactTags.some(tag => selectedTagIds.includes(tag.id))) return false;
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (sortField) {
        case 'name':
          aVal = (a.name || 'zzz').toLowerCase();
          bVal = (b.name || 'zzz').toLowerCase();
          break;
        case 'company':
          aVal = (a.company || 'zzz').toLowerCase();
          bVal = (b.company || 'zzz').toLowerCase();
          break;
        case 'engagement':
          aVal = a.avg_engagement || 0;
          bVal = b.avg_engagement || 0;
          break;
        case 'visits':
          aVal = a.total_views || 0;
          bVal = b.total_views || 0;
          break;
        case 'files':
          aVal = a.files_viewed?.length || 0;
          bVal = b.files_viewed?.length || 0;
          break;
        case 'lastSeen':
        default:
          aVal = new Date(a.last_seen_at).getTime();
          bVal = new Date(b.last_seen_at).getTime();
          break;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'desc' ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
      }
      return sortOrder === 'desc' ? (bVal as number) - (aVal as number) : (aVal as number) - (bVal as number);
    });

    return filtered;
  }, [contacts, intentFilter, actionFilters, searchQuery, selectedTagIds, contactTagsMap, sortField, sortOrder]);

  const hotLeads = useMemo(() => {
    return contacts.filter(c => c.is_hot_lead || c.avg_engagement >= 70);
  }, [contacts]);

  const insights = useMemo(() => {
    return generateContactsInsights(contacts);
  }, [contacts]);

  const recommendedActions = useMemo(() => generateContactActions(contacts), [contacts]);

  const engagementBreakdown = useMemo(() => {
    const hot = contacts.filter(c => c.avg_engagement >= 70).length;
    const warm = contacts.filter(c => c.avg_engagement >= 40 && c.avg_engagement < 70).length;
    const cold = contacts.filter(c => c.avg_engagement < 40).length;
    const total = contacts.length || 1;

    return {
      hot: { count: hot, percent: Math.round((hot / total) * 100) },
      warm: { count: warm, percent: Math.round((warm / total) * 100) },
      cold: { count: cold, percent: Math.round((cold / total) * 100) },
    };
  }, [contacts]);

  const handleExportCSV = async () => {
    if (!filteredContacts.length) return;
    setExporting(true);
    try {
      const headers = ['Name', 'Email', 'Company', 'Engagement', 'Visits', 'First seen', 'Last seen'];
      const rows = filteredContacts.map(c => [
        c.name || 'Anonymous',
        c.email || '',
        c.company || '',
        c.avg_engagement,
        c.total_views,
        new Date(c.first_seen_at).toLocaleDateString(),
        new Date(c.last_seen_at).toLocaleDateString(),
      ]);

      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `contacts-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  };

  const handleContactClick = (contactId: string) => {
    router.push(`/dashboard/contacts/${contactId}`);
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600">Loading contacts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600">{error}</p>
          <button onClick={fetchContacts} className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* HEADER with Period Selector and Export */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <span>👥</span> Contacts
            </h1>
            <p className="mt-1 text-slate-600">{contacts.length} total contacts</p>
          </div>

          <button
            onClick={handleExportCSV}
            disabled={exporting || !contacts.length}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>

        <PeriodSelector
          selectedPeriod={periodFilter.selectedPeriod}
          customRange={periodFilter.customRange}
          userTier={userTier}
          onPeriodChange={(period) => {
            const success = periodFilter.setSelectedPeriod(period);
            if (!success) {
              setUpgradeRequiredTier(periodFilter.getRequiredTierForPeriod(period));
              setShowUpgradeModal(true);
            }
            return success;
          }}
          onCustomRangeChange={periodFilter.setCustomRange}
          onUpgradeClick={(tier) => {
            setUpgradeRequiredTier(tier);
            setShowUpgradeModal(true);
          }}
          formatDateRange={periodFilter.formatDateRange}
          effectiveRange={periodFilter.effectiveRange}
        />
      </div>

      {/* FILTERS ROW */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        {/* Intent Filter Buttons */}
        <div className="flex items-center gap-1 bg-white rounded-xl p-1 border border-slate-200 shadow-sm">
          {[
            { id: 'all', label: 'All' },
            { id: 'hot', label: '🔥 Hot' },
            { id: 'warm', label: '🟡 Warm' },
            { id: 'cold', label: '⚪ Cold' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setIntentFilter(f.id as IntentFilter)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                intentFilter === f.id
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Action Filters */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleActionFilter('downloaded')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
              actionFilters.includes('downloaded')
                ? 'bg-green-100 text-green-700 border border-green-300'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            📥 Downloaded
            {actionCounts.downloaded > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                actionFilters.includes('downloaded') ? 'bg-green-200' : 'bg-slate-100'
              }`}>
                {actionCounts.downloaded}
              </span>
            )}
          </button>
          <button
            onClick={() => toggleActionFilter('return')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
              actionFilters.includes('return')
                ? 'bg-purple-100 text-purple-700 border border-purple-300'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            🔄 Return
            {actionCounts.return > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                actionFilters.includes('return') ? 'bg-purple-200' : 'bg-slate-100'
              }`}>
                {actionCounts.return}
              </span>
            )}
          </button>
        </div>

        {/* Tag Filter */}
        <TagFilter
          availableTags={availableContactTags}
          selectedTags={selectedTagIds}
          onTagsChange={setSelectedTagIds}
        />

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-white rounded-xl p-1 border border-slate-200 shadow-sm">
          <button
            onClick={() => handleViewModeChange('individual')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              viewMode === 'individual'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            👤 Individual
          </button>
          <button
            onClick={() => handleViewModeChange('company')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              viewMode === 'company'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            🏢 By company
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="mb-6">
        <div className="flex items-center bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
          <span className="text-slate-400 mr-2">🔍</span>
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent outline-none text-slate-800 placeholder:text-slate-400 flex-1"
          />
        </div>
      </div>

      {/* Key Insights & Recommended Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Key Insights */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span>💡</span>
            <span className="font-semibold text-slate-800 text-sm tracking-wide">Key insights</span>
            <InfoTooltip content={getMetricDefinition('keyInsights')} position="top" />
            {insights.length > 0 && (
              <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {insights.length}
              </span>
            )}
          </div>
          {insights.length > 0 ? (
            <div className="space-y-2">
              {insights.map((insight, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
                  <span className="text-xl">{insight.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{insight.text}</p>
                    <p className="text-xs text-slate-600">→ {insight.implication}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-500">
              <div className="text-3xl mb-2">💡</div>
              <p className="text-sm">No insights yet</p>
              <p className="text-xs mt-1">Insights appear as contacts engage</p>
            </div>
          )}
        </div>

        {/* Recommended Actions */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span>✅</span>
            <span className="font-semibold text-slate-800 text-sm tracking-wide">Recommended actions</span>
            <InfoTooltip content={getMetricDefinition('recommendedActions')} position="top" />
            {recommendedActions.length > 0 && (
              <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {recommendedActions.length}
              </span>
            )}
          </div>
          {recommendedActions.length > 0 ? (
            <div className="space-y-2">
              {recommendedActions.map((action, i) => (
                <div key={i} className={`p-3 rounded-lg border ${
                  action.priority === 'high' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
                }`}>
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{action.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{action.title}</p>
                      <p className="text-xs text-slate-600">{action.reason}</p>
                    </div>
                    {action.data && action.actionType === 'email' && (
                      <button
                        onClick={() => window.location.href = `mailto:${action.data}`}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
                      >
                        📧 Email
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-500">
              <div className="text-3xl mb-2">✅</div>
              <p className="text-sm">No actions needed</p>
              <p className="text-xs mt-1">Actions appear based on contact activity</p>
            </div>
          )}
        </div>
      </div>

      {/* Engagement Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span>🎯</span>
          <span className="font-semibold text-slate-800 text-sm tracking-wide">Engagement by viewer</span>
          <InfoTooltip content={getMetricDefinition('engagementBreakdown')} position="top" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-700">{engagementBreakdown.hot.count}</div>
            <div className="text-xs text-red-600">🔥 Hot ({engagementBreakdown.hot.percent}%)</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-700">{engagementBreakdown.warm.count}</div>
            <div className="text-xs text-yellow-600">🟡 Warm ({engagementBreakdown.warm.percent}%)</div>
          </div>
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <div className="text-2xl font-bold text-slate-700">{engagementBreakdown.cold.count}</div>
            <div className="text-xs text-slate-600">⚪ Cold ({engagementBreakdown.cold.percent}%)</div>
          </div>
        </div>
      </div>

      {/* Company View */}
      {viewMode === 'company' ? (
        <CompanyView contacts={filteredContacts} files={files} onContactClick={handleContactClick} />
      ) : (
        <>
          {/* CONTACT NOW (Hot Leads) - Always visible regardless of filters */}
          {hotLeads.length > 0 && intentFilter === 'all' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                🔥 Contact now ({hotLeads.length} people)
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full" style={{ overflow: 'visible' }}>
                  <thead>
                    <tr className="text-left text-sm text-slate-500 border-b border-slate-200">
                      <SortableHeader label="Name" field="name" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} />
                      <SortableHeader label="Company" field="company" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} />
                      <SortableHeader label="Engagement Score" field="engagement" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} />
                      <SortableHeader label="Visits" field="visits" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} />
                      <SortableHeader label="Files" field="files" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} />
                      <SortableHeader label="Last" field="lastSeen" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} />
                      <th className="pb-3 px-4 font-medium">Tags</th>
                      <th className="pb-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hotLeads.slice(0, 5).map(contact => (
                      <ContactRow
                        key={contact.id}
                        contact={contact}
                        isHot
                        onClick={() => handleContactClick(contact.id)}
                        tags={contactTagsMap[contact.id] || []}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
              {hotLeads.length > 5 && (
                <button
                  onClick={() => setIntentFilter('hot')}
                  className="w-full mt-4 py-2 text-sm font-semibold text-orange-600 hover:text-orange-700"
                >
                  View all {hotLeads.length} hot leads →
                </button>
              )}
            </div>
          )}

          {/* ALL CONTACTS TABLE */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">📊 All contacts</h2>

            {filteredContacts.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">👥</div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  {searchQuery || intentFilter !== 'all' || actionFilters.length > 0 ? 'No matching contacts' : 'No contacts yet'}
                </h3>
                <p className="text-slate-600 mb-6">
                  {searchQuery || intentFilter !== 'all' || actionFilters.length > 0
                    ? 'Try adjusting your search or filters'
                    : 'Contacts appear when viewers access your files with their name or email'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full" style={{ overflow: 'visible' }}>
                  <thead>
                    <tr className="text-left text-sm text-slate-500 border-b border-slate-200">
                      <SortableHeader label="Name" field="name" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} />
                      <SortableHeader label="Company" field="company" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} />
                      <SortableHeader label="Engagement Score" field="engagement" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} />
                      <SortableHeader label="Visits" field="visits" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} />
                      <SortableHeader label="Last" field="lastSeen" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} />
                      <th className="pb-3 px-4 font-medium">Tags</th>
                      <th className="pb-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContacts.map(contact => (
                      <ContactRow
                        key={contact.id}
                        contact={contact}
                        onClick={() => handleContactClick(contact.id)}
                        tags={contactTagsMap[contact.id] || []}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        requiredTier={upgradeRequiredTier}
        onUpgrade={() => window.location.href = '/dashboard/settings'}
        feature="analytics history"
      />
    </div>
  );
}
