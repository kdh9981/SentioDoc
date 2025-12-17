import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';
import { promises as dns } from 'dns';

// POST /api/domains/[id]/verify - Verify DNS configuration
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userEmail = user.email;
        const { id } = await params;

        // Get domain
        const { data: domain } = await supabaseAdmin
            .from('custom_domains')
            .select('*')
            .eq('id', id)
            .eq('user_email', userEmail)
            .single();

        if (!domain) {
            return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
        }

        // Verify DNS
        let verified = false;
        let errorMessage = '';

        try {
            if (domain.subdomain) {
                // Check CNAME record
                const records = await dns.resolveCname(domain.full_domain);
                verified = records.some(record =>
                    record === 'doc.sentio.ltd' || record === 'doc.sentio.ltd.'
                );
                if (!verified) {
                    errorMessage = `CNAME record not found. Expected: doc.sentio.ltd, Found: ${records.join(', ')}`;
                }
            } else {
                // Check A record
                const records = await dns.resolve4(domain.full_domain);
                // TODO: Replace with your actual server IP
                const expectedIP = 'YOUR_SERVER_IP';
                verified = records.includes(expectedIP);
                if (!verified) {
                    errorMessage = `A record not pointing to our server. Found: ${records.join(', ')}`;
                }
            }
        } catch (dnsError: any) {
            errorMessage = `DNS lookup failed: ${dnsError.code || dnsError.message}`;
            verified = false;
        }

        // Update status
        const { error: updateError } = await supabaseAdmin
            .from('custom_domains')
            .update({
                verification_status: verified ? 'verified' : 'failed',
                last_verified_at: new Date().toISOString(),
                is_active: verified
            })
            .eq('id', id);

        if (updateError) throw updateError;

        return NextResponse.json({
            verified,
            status: verified ? 'verified' : 'failed',
            message: verified
                ? 'DNS verification successful! Your domain is ready to use.'
                : errorMessage,
            nextSteps: verified
                ? 'Contact admin to complete SSL setup'
                : 'Please check your DNS settings and try again'
        });
    } catch (error) {
        console.error('Verify domain error:', error);
        return NextResponse.json({ error: 'Failed to verify domain' }, { status: 500 });
    }
}
