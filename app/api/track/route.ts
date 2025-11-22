import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import geoip from 'geoip-lite';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { fileId, viewerName, viewerEmail } = body;

        if (!fileId || !viewerName || !viewerEmail) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Validate Email Domain (MX Records)
        try {
            const domain = viewerEmail.split('@')[1];
            if (!domain) throw new Error('Invalid email format');

            const { resolveMx } = require('dns/promises');
            const mxRecords = await resolveMx(domain);

            if (!mxRecords || mxRecords.length === 0) {
                return NextResponse.json({ error: 'Invalid email domain: No mail server found' }, { status: 400 });
            }
        } catch (error) {
            console.error('Email validation error:', error);
            return NextResponse.json({ error: 'Invalid email domain: Does not exist' }, { status: 400 });
        }

        const userAgent = request.headers.get('user-agent') || '';
        let ipAddress = request.headers.get('x-forwarded-for') || '127.0.0.1';

        // Handle multiple IPs in x-forwarded-for
        if (ipAddress.includes(',')) {
            ipAddress = ipAddress.split(',')[0].trim();
        }

        const geo = geoip.lookup(ipAddress);
        const country = geo ? geo.country : 'Unknown';

        // Insert access log
        const { error: logError } = await supabaseAdmin
            .from('access_logs')
            .insert({
                file_id: fileId,
                viewer_name: viewerName,
                viewer_email: viewerEmail,
                user_agent: userAgent,
                ip_address: ipAddress,
                country: country
            });

        if (logError) throw logError;

        // Increment view count using RPC function
        const { error: updateError } = await supabaseAdmin
            .rpc('increment_file_views', { file_id: fileId });

        if (updateError) throw updateError;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Tracking error:', error);
        return NextResponse.json({ error: 'Tracking failed' }, { status: 500 });
    }
}

