import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';
import { getTierLimits } from '@/lib/tierLimits';
import { canAddDomain } from '@/lib/usageTracking';

// Helper to get user tier
async function getUserTier(userEmail: string) {
    const { data } = await supabaseAdmin
        .from('authorized_users')
        .select('tier')
        .eq('email', userEmail)
        .single();

    return data?.tier || 'free';
}

// GET /api/domains - List user's custom domains
export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userEmail = user.email;
        const tier = await getUserTier(userEmail);

        // Fetch domains
        const { data: domains, error } = await supabaseAdmin
            .from('custom_domains')
            .select('*')
            .eq('user_email', userEmail)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const tierLimits = getTierLimits(tier);
        return NextResponse.json({
            domains: domains || [],
            tier,
            limits: {
                max: tierLimits.customDomains,
                current: domains?.length || 0
            }
        });
    } catch (error) {
        console.error('Get domains error:', error);
        return NextResponse.json({ error: 'Failed to fetch domains' }, { status: 500 });
    }
}

// POST /api/domains - Add new custom domain
export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userEmail = user.email;
        const body = await request.json();
        const { subdomain, domain } = body;

        // Validate input
        if (!domain || typeof domain !== 'string') {
            return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
        }

        // Check tier limits
        const tier = await getUserTier(userEmail);
        const domainCheck = await canAddDomain(userEmail, tier);
        if (!domainCheck.allowed) {
            return NextResponse.json({ error: domainCheck.reason }, { status: 403 });
        }

        // Build full domain
        const fullDomain = subdomain
            ? `${subdomain}.${domain}`.toLowerCase()
            : domain.toLowerCase();

        // Validate domain format
        const domainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/;
        if (!domainRegex.test(fullDomain)) {
            return NextResponse.json({ error: 'Invalid domain format' }, { status: 400 });
        }

        // Check if domain already exists
        const { data: existing } = await supabaseAdmin
            .from('custom_domains')
            .select('id, user_email')
            .eq('full_domain', fullDomain)
            .single();

        if (existing) {
            if (existing.user_email === userEmail) {
                return NextResponse.json({ error: 'You have already added this domain' }, { status: 409 });
            } else {
                return NextResponse.json({ error: 'This domain is already in use' }, { status: 409 });
            }
        }

        // Insert new domain
        const { data: newDomain, error: insertError } = await supabaseAdmin
            .from('custom_domains')
            .insert({
                user_email: userEmail,
                subdomain: subdomain || null,
                domain,
                full_domain: fullDomain,
                verification_status: 'pending'
            })
            .select()
            .single();

        if (insertError) throw insertError;

        // Generate DNS instructions
        const dnsInstructions = {
            type: subdomain ? 'CNAME' : 'A',
            host: subdomain || '@',
            value: subdomain ? 'doc.sentio.ltd' : 'YOUR_SERVER_IP', // TODO: Replace with actual IP
            ttl: 'Auto'
        };

        return NextResponse.json({
            domain: newDomain,
            dnsInstructions
        }, { status: 201 });
    } catch (error) {
        console.error('Add domain error:', error);
        return NextResponse.json({ error: 'Failed to add domain' }, { status: 500 });
    }
}
