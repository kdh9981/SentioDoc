import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import geoip from 'geoip-lite';
import { UAParser } from 'ua-parser-js';
import { canTrackView } from '@/lib/usageTracking';
import { detectAccessMethod } from '@/lib/analytics';

// Parse traffic source from referrer URL
function parseTrafficSource(referrer: string | null): string {
    if (!referrer) return 'direct';

    const url = referrer.toLowerCase();

    if (url.includes('linkedin.com')) return 'linkedin';
    if (url.includes('twitter.com') || url.includes('t.co') || url.includes('x.com')) return 'twitter';
    if (url.includes('facebook.com') || url.includes('fb.com')) return 'facebook';
    if (url.includes('instagram.com')) return 'instagram';
    if (url.includes('google.com') || url.includes('google.co')) return 'google';
    if (url.includes('bing.com')) return 'bing';
    if (url.includes('yahoo.com')) return 'yahoo';
    if (url.includes('youtube.com')) return 'youtube';
    if (url.includes('reddit.com')) return 'reddit';
    if (url.includes('github.com')) return 'github';
    if (url.includes('mail.google.com') || url.includes('mail.yahoo.com') || url.includes('outlook.')) return 'email';
    if (url.includes('slack.com')) return 'slack';
    if (url.includes('discord.com')) return 'discord';
    if (url.includes('notion.so')) return 'notion';
    if (url.includes('t.me') || url.includes('telegram.')) return 'telegram';
    if (url.includes('whatsapp.com')) return 'whatsapp';

    return 'referral';
}

// Normalize device type
function normalizeDeviceType(deviceType: string | undefined): string {
    if (!deviceType) return 'desktop';
    const type = deviceType.toLowerCase();
    if (type === 'mobile' || type === 'smartphone') return 'mobile';
    if (type === 'tablet') return 'tablet';
    return 'desktop';
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { fileId, viewerName, viewerEmail, referrer, sessionId, totalPages } = body;

        if (!fileId) {
            return NextResponse.json({ error: 'Missing file ID' }, { status: 400 });
        }

        // Validate Email Domain (MX Records) - only if email is provided
        if (viewerEmail) {
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
        }

        // Get file data including name and owner_email for denormalization
        const { data: fileData } = await supabaseAdmin
            .from('files')
            .select('user_email, name, type, mime_type')
            .eq('id', fileId)
            .single();

        if (!fileData) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        // Check view tracking limit for file owner
        if (fileData.user_email) {
            const { data: ownerData } = await supabaseAdmin
                .from('authorized_users')
                .select('tier')
                .eq('email', fileData.user_email)
                .single();

            const ownerTier = ownerData?.tier || 'free';
            const viewCheck = await canTrackView(fileData.user_email, ownerTier);

            if (!viewCheck.allowed) {
                console.log(`View tracking limit reached for ${fileData.user_email}`);
                return NextResponse.json({ success: true, tracked: false });
            }
        }

        // Get IP address
        let ipAddress = request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown';

        if (ipAddress.includes(',')) {
            ipAddress = ipAddress.split(',')[0].trim();
        }

        // Parse User Agent
        const userAgentString = request.headers.get('user-agent') || '';
        const parser = new UAParser(userAgentString);
        const uaResult = parser.getResult();

        const deviceType = normalizeDeviceType(uaResult.device.type);
        const os = uaResult.os.name || 'Unknown';
        const browser = uaResult.browser.name || 'Unknown';

        // Get location from IP
        const geo = geoip.lookup(ipAddress);
        const country = geo?.country || 'Unknown';
        const city = geo?.city || null;

        // Parse traffic source from referrer
        const trafficSource = parseTrafficSource(referrer);

        // Check if this is a return visit
        let isReturnVisit = false;
        if (sessionId) {
            const { data: existingVisits } = await supabaseAdmin
                .from('access_logs')
                .select('id')
                .eq('session_id', sessionId)
                .eq('file_id', fileId)
                .limit(1);

            isReturnVisit = !!(existingVisits && existingVisits.length > 0);
        }

        // Detect if this is a QR scan
        const utmMedium = body.utm_medium || null;
        const accessMethod = detectAccessMethod(referrer, utmMedium, userAgentString);

        // Determine file_type for icon display
        let fileType = 'file';
        if (fileData.type === 'url') {
            fileType = 'url';
        } else if (fileData.mime_type) {
            const mt = fileData.mime_type.toLowerCase();
            if (mt.includes('pdf')) fileType = 'pdf';
            else if (mt.includes('video') || mt.includes('mp4') || mt.includes('mov')) fileType = 'video';
            else if (mt.includes('presentation') || mt.includes('ppt')) fileType = 'pptx';
            else if (mt.includes('word') || mt.includes('doc')) fileType = 'docx';
            else if (mt.includes('sheet') || mt.includes('xls')) fileType = 'xlsx';
            else if (mt.includes('image')) fileType = 'image';
        }

        // Insert access log with file_name and owner_email for self-contained contact queries
        const { data: insertedLog, error: logError } = await supabaseAdmin
            .from('access_logs')
            .insert({
                file_id: fileId,
                file_name: fileData.name,           // NEW: Denormalized file name
                owner_email: fileData.user_email,   // NEW: Denormalized owner email
                viewer_name: viewerName || null,
                viewer_email: viewerEmail || null,
                user_agent: userAgentString,
                ip_address: ipAddress,
                country: country,
                city: city,
                device_type: deviceType,
                os: os,
                browser: browser,
                referrer_url: referrer || null,
                traffic_source: trafficSource,
                session_id: sessionId || null,
                is_return_visit: isReturnVisit,
                total_pages: totalPages || 0,
                entry_page: 1,
                access_method: accessMethod,
                file_type: fileType,
                link_type: fileData.type || 'file',
            })
            .select('id')
            .single();

        if (logError) {
            console.error('Access log error:', logError);
            return NextResponse.json({ error: 'Failed to log access' }, { status: 500 });
        }

        // Increment view count using RPC function
        const { error: updateError } = await supabaseAdmin
            .rpc('increment_file_views', { file_id: fileId });

        if (updateError) {
            console.error('Increment views error:', updateError);
        }

        return NextResponse.json({
            success: true,
            logId: insertedLog?.id,
            isReturnVisit
        });

    } catch (error) {
        console.error('Track API error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
