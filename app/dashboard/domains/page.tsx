'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase-auth';

interface CustomDomain {
  id: string;
  domain: string;
  is_verified: boolean;
  verification_token: string | null;
  created_at: string;
  verified_at: string | null;
  ssl_status: string | null;
  links_count?: number;
}

type UserTier = 'free' | 'starter' | 'pro';

export default function DomainsPage() {
  const supabase = createClient();

  const [domains, setDomains] = useState<CustomDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userTier, setUserTier] = useState<UserTier>('free');
  const [verifying, setVerifying] = useState<string | null>(null);

  const fetchDomains = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return;

      // Fetch domains
      const { data: domainsData, error: domainsError } = await supabase
        .from('custom_domains')
        .select('*')
        .eq('user_email', user.email)
        .order('created_at', { ascending: false });

      if (!domainsError && domainsData) {
        // Get links count for each domain
        const domainsWithCounts = await Promise.all(
          domainsData.map(async (domain) => {
            const { count } = await supabase
              .from('files')
              .select('*', { count: 'exact', head: true })
              .eq('custom_domain_id', domain.id)
              .is('deleted_at', null);
            return { ...domain, links_count: count || 0 };
          })
        );
        setDomains(domainsWithCounts);
      }

      // Get user tier from authorized_users
      const { data: userData } = await supabase
        .from('authorized_users')
        .select('tier')
        .eq('email', user.email)
        .single();

      if (userData?.tier) {
        setUserTier(userData.tier as UserTier);
      }
    } catch (err) {
      console.error('Error fetching domains:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchDomains();
  }, [fetchDomains]);

  const handleAddDomain = async () => {
    if (!newDomain.trim()) return;

    // Validate domain format
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
    if (!domainRegex.test(newDomain)) {
      setError('Please enter a valid domain (e.g., links.yourcompany.com)');
      return;
    }

    setAdding(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('Not authenticated');

      // Generate verification token
      const verificationToken = `linklens-verify-${crypto.randomUUID().slice(0, 8)}`;

      const { data, error: insertError } = await supabase
        .from('custom_domains')
        .insert({
          user_email: user.email,
          domain: newDomain.toLowerCase(),
          is_verified: false,
          verification_token: verificationToken,
        })
        .select()
        .single();

      if (insertError) {
        if (insertError.code === '23505') {
          throw new Error('This domain is already registered');
        }
        throw insertError;
      }

      setDomains([{ ...data, links_count: 0 }, ...domains]);
      setNewDomain('');
      setShowAddModal(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add domain';
      setError(errorMessage);
    } finally {
      setAdding(false);
    }
  };

  const handleVerifyDomain = async (domainId: string) => {
    setVerifying(domainId);

    try {
      const res = await fetch(`/api/domains/${domainId}/verify`, {
        method: 'POST',
      });

      const data = await res.json();

      if (data.verified) {
        setDomains(domains.map(d =>
          d.id === domainId
            ? { ...d, is_verified: true, verified_at: new Date().toISOString() }
            : d
        ));
        alert('Domain verified successfully!');
      } else {
        alert(data.message || 'DNS verification failed. Please ensure your CNAME record is properly configured and try again.');
      }
    } catch (err) {
      alert('Failed to verify domain. Please try again.');
    } finally {
      setVerifying(null);
    }
  };

  const handleRemoveDomain = async (domainId: string) => {
    const domain = domains.find(d => d.id === domainId);
    if (!domain) return;

    const linksCount = domain.links_count || 0;
    const message = linksCount > 0
      ? `Remove "${domain.domain}"? ${linksCount} link${linksCount !== 1 ? 's' : ''} using this domain will revert to linklens.tech`
      : `Remove "${domain.domain}"?`;

    if (!confirm(message)) return;

    try {
      await supabase
        .from('custom_domains')
        .delete()
        .eq('id', domainId);

      setDomains(domains.filter(d => d.id !== domainId));
    } catch (err) {
      alert('Failed to remove domain');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-48 mb-4"></div>
          <div className="h-64 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Free tier upgrade prompt
  if (userTier === 'free') {
    return (
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">🌐 Custom domains</h1>
          <p className="text-slate-600">Use your own domain for branded links</p>
        </div>

        {/* Default Domain */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h2 className="text-sm font-semibold text-slate-500 tracking-wider mb-4">Default domain</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔗</span>
              <div>
                <div className="font-medium text-slate-900">linklens.tech</div>
                <div className="text-sm text-slate-500">Your default LinkLens domain</div>
              </div>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              Active
            </span>
          </div>
        </div>

        {/* Upgrade Prompt */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-8 text-center">
          <div className="text-5xl mb-4">🌐</div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Custom domains</h3>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            Use your own branded domain like <strong>links.yourcompany.com</strong> instead of linklens.tech
          </p>
          <div className="flex flex-col items-center gap-4">
            <a
              href="/pricing"
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium"
            >
              Upgrade to Starter ($9/mo)
            </a>
            <p className="text-sm text-slate-500">
              Custom domains included in Starter and Pro plans
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mt-6">
          <h2 className="text-sm font-semibold text-slate-500 tracking-wider mb-4">How it works</h2>
          <div className="space-y-4 text-sm text-slate-600">
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
              <span>Add your custom domain (e.g., links.yourcompany.com)</span>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
              <span>Add a CNAME record pointing to <code className="bg-slate-100 px-1 rounded">cname.linklens.tech</code></span>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
              <span>Wait for DNS propagation (up to 48 hours)</span>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">4</span>
              <span>Verify your domain and start using branded links!</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Starter/Pro tier - full functionality
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">🌐 Custom domains</h1>
          <p className="text-slate-600">Use your own domain for branded links</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          + Add domain
        </button>
      </div>

      {/* Default Domain */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-500 tracking-wider mb-4">Default domain</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔗</span>
            <div>
              <div className="font-medium text-slate-900">linklens.tech</div>
              <div className="text-sm text-slate-500">Your default LinkLens domain</div>
            </div>
          </div>
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            Active
          </span>
        </div>
      </div>

      {/* Custom Domains */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-500 tracking-wider mb-4">Custom domains</h2>

        {domains.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {domains.map(domain => (
              <div key={domain.id} className="py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🌐</span>
                  <div>
                    <div className="font-medium text-slate-900">{domain.domain}</div>
                    <div className="text-sm text-slate-500">
                      Added {formatDate(domain.created_at)}
                      {domain.links_count !== undefined && domain.links_count > 0 &&
                        ` • ${domain.links_count} link${domain.links_count !== 1 ? 's' : ''} using this domain`
                      }
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {domain.is_verified ? (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      Verified
                    </span>
                  ) : (
                    <>
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                        Pending
                      </span>
                      <button
                        onClick={() => handleVerifyDomain(domain.id)}
                        disabled={verifying === domain.id}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 disabled:opacity-50"
                      >
                        {verifying === domain.id ? 'Verifying...' : 'Verify'}
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleRemoveDomain(domain.id)}
                    className="px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <p>No custom domains added yet</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              + Add your first domain
            </button>
          </div>
        )}
      </div>

      {/* How To Add */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
        <h2 className="text-sm font-semibold text-slate-500 tracking-wider mb-4">How to add a custom domain</h2>
        <div className="space-y-3 text-sm text-slate-600">
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
            <span>Add your domain above</span>
          </div>
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
            <div>
              Add a CNAME record in your DNS settings:
              <div className="mt-2 bg-white rounded-lg p-3 font-mono text-xs">
                <div className="flex gap-8">
                  <span className="text-slate-500">Type:</span>
                  <span>CNAME</span>
                </div>
                <div className="flex gap-8">
                  <span className="text-slate-500">Name:</span>
                  <span>links (or your subdomain)</span>
                </div>
                <div className="flex gap-8">
                  <span className="text-slate-500">Value:</span>
                  <span>cname.linklens.tech</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
            <span>Wait for DNS propagation (up to 48 hours)</span>
          </div>
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">4</span>
            <span>Click &quot;Verify&quot; to confirm your domain is working</span>
          </div>
        </div>
      </div>

      {/* Add Domain Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Add custom domain</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Domain
              </label>
              <input
                type="text"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="links.yourcompany.com"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">
                Enter a subdomain like links.yourcompany.com
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewDomain('');
                  setError(null);
                }}
                className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddDomain}
                disabled={adding || !newDomain.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
              >
                {adding ? 'Adding...' : 'Add domain'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
