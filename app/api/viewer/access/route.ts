import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import geoip from 'geoip-lite';
import { UAParser } from 'ua-parser-js';
import bcrypt from 'bcryptjs';
import { parseReferrerSource, detectAccessMethod } from '@/lib/analytics';

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
        console.log('[viewer/access] ========== REQUEST RECEIVED ==========');

        const body = await request.json();
        const { fileId, email, name, password } = body;

        console.log('[viewer/access] fileId:', fileId);
        console.log('[viewer/access] email:', email);
        console.log('[viewer/access] name:', name);

        if (!fileId) {
            console.error('[viewer/access] ERROR: Missing file ID');
            return NextResponse.json({ error: 'Missing file ID' }, { status: 400 });
        }

        // Get file info including password hash, mime_type, and owner for denormalization
        const { data: file, error: fileError } = await supabaseAdmin
            .from('files')
            .select('id, name, user_email, password_hash, require_email, require_name, mime_type, type')
            .eq('id', fileId)
            .single();

        if (fileError || !file) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        // Validate password if required
        if (file.password_hash) {
            if (!password) {
                return NextResponse.json({ error: 'Password required' }, { status: 401 });
            }

            // Check if password_hash is bcrypt or plain text
            const isBcryptHash = file.password_hash.startsWith('$2');
            let isValid = false;

            if (isBcryptHash) {
                isValid = await bcrypt.compare(password, file.password_hash);
            } else {
                // Plain text comparison (legacy)
                isValid = password === file.password_hash;
            }

            if (!isValid) {
                return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
            }
        }

        // Validate email if provided
        if (email) {
            try {
                const domain = email.split('@')[1];
                if (domain) {
                    const { resolveMx } = require('dns/promises');
                    const mxRecords = await resolveMx(domain);
                    if (!mxRecords || mxRecords.length === 0) {
                        return NextResponse.json({ error: 'Invalid email domain' }, { status: 400 });
                    }
                }
            } catch (error) {
                // Allow email even if MX check fails - could be network issue
                console.warn('Email MX check failed:', error);
            }
        }

        // Get IP and geo info
        let ipAddress = request.headers.get('x-forwarded-for') ||
                        request.headers.get('x-real-ip') ||
                        '127.0.0.1';

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
        const region = geo?.region || null;

        // Get language from headers
        const language = request.headers.get('accept-language')?.split(',')[0] || null;

        // Extract UTM parameters from request URL
        const url = new URL(request.url);

        // Parse referrer and get source category
        // First check for external referrer passed via query param (captured before redirect)
        const externalReferrer = url.searchParams.get('ref') || body.ref || null;
        const headerReferrer = request.headers.get('referer') || null;
        // Prefer external referrer if available
        const referrer = externalReferrer || headerReferrer || null;
        const referrerSource = parseReferrerSource(referrer);
        const utmSource = url.searchParams.get('utm_source') || body.utm_source || null;
        const utmMedium = url.searchParams.get('utm_medium') || body.utm_medium || null;
        const utmCampaign = url.searchParams.get('utm_campaign') || body.utm_campaign || null;
        const utmTerm = url.searchParams.get('utm_term') || body.utm_term || null;
        const utmContent = url.searchParams.get('utm_content') || body.utm_content || null;

        // Detect access method (QR scan vs direct click)
        const accessMethod = detectAccessMethod(referrer, utmMedium, userAgentString);

        // Determine traffic source from UTM or referrer
        const trafficSource = utmSource || referrerSource || 'direct';

        // Determine file type from mime_type
        const getFileType = (mimeType: string | null, fileType: string | null): string => {
            if (fileType === 'url') return 'url';
            if (!mimeType) return 'unknown';
            if (mimeType === 'application/pdf') return 'pdf';
            if (mimeType.startsWith('image/')) return 'image';
            if (mimeType.startsWith('video/')) return 'video';
            if (mimeType.startsWith('audio/')) return 'audio';
            if (mimeType.startsWith('text/') || mimeType.includes('document')) return 'document';
            if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation';
            if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'spreadsheet';
            return 'other';
        };
        const fileTypeCategory = getFileType(file.mime_type, file.type);

        // Check for previous visits (return visit detection)
        let isReturnVisit = false;
        let returnVisitCount = 0;

        if (email || ipAddress !== '127.0.0.1') {
            // Build OR condition for checking previous visits
            let orCondition = '';
            if (email) {
                orCondition = `viewer_email.eq.${email}`;
            }
            if (ipAddress && ipAddress !== '127.0.0.1') {
                orCondition = orCondition
                    ? `${orCondition},ip_address.eq.${ipAddress}`
                    : `ip_address.eq.${ipAddress}`;
            }

            if (orCondition) {
                const { data: previousVisits, error: visitError } = await supabaseAdmin
                    .from('access_logs')
                    .select('id')
                    .eq('file_id', fileId)
                    .or(orCondition)
                    .limit(100);

                if (!visitError && previousVisits) {
                    isReturnVisit = previousVisits.length > 0;
                    returnVisitCount = previousVisits.length;
                }
            }
        }

        // Generate session ID
        const sessionId = crypto.randomUUID();

        console.log('[viewer/access] About to insert access_log...');
        console.log('[viewer/access] Insert data:', JSON.stringify({
            file_id: fileId,
            file_name: file.name,
            owner_email: file.user_email,
            session_id: sessionId,
        }, null, 2));

        // Insert access log with all new fields including denormalized file_name and owner_email
        const { data: accessLog, error: logError } = await supabaseAdmin
            .from('access_logs')
            .insert({
                file_id: fileId,
                file_name: file.name,              // Denormalized for Contact page
                owner_email: file.user_email,      // Denormalized for Contact page
                viewer_name: name || 'Anonymous',
                viewer_email: email || '',
                user_agent: userAgentString,
                ip_address: ipAddress,
                country: country,
                city: city,
                region: region,
                device_type: deviceType,
                os: os,
                browser: browser,
                language: language,
                referrer_url: referrer,
                referrer_source: referrerSource,
                original_referrer: externalReferrer,
                // UTM parameters
                utm_source: utmSource,
                utm_medium: utmMedium,
                utm_campaign: utmCampaign,
                utm_term: utmTerm,
                utm_content: utmContent,
                // Access method
                access_method: accessMethod,
                // Traffic source and file type
                traffic_source: trafficSource,
                file_type: fileTypeCategory,
                link_type: file.type || 'file',
                // Return visit tracking
                is_return_visit: isReturnVisit,
                return_visit_count: returnVisitCount,
                // Session
                session_id: sessionId,
                // Initial values
                total_pages: 0,
                entry_page: 1,
                pages_viewed_count: 0,
                max_page_reached: 0,
                completion_percentage: 0,
                total_duration_seconds: 0,
            })
            .select('id')
            .single();

        if (logError) {
            console.error('[viewer/access] INSERT ERROR:', logError);
            console.error('[viewer/access] Error code:', logError.code);
            console.error('[viewer/access] Error message:', logError.message);
            console.error('[viewer/access] Error details:', logError.details);

            // Return the error so we can see it in browser!
            return NextResponse.json({
                success: false,
                error: 'Failed to create access log',
                errorCode: logError.code,
                errorMessage: logError.message,
                errorDetails: logError.details,
                accessLogId: '',
                isReturnVisit,
            });
        } else {
            console.log('[viewer/access] INSERT SUCCESS! accessLogId:', accessLog?.id);
        }

        // Increment view count
        await supabaseAdmin.rpc('increment_file_views', { file_id: fileId });

        return NextResponse.json({
            success: true,
            accessLogId: accessLog?.id || '',
            isReturnVisit,
        });

    } catch (error) {
        console.error('Viewer access error:', error);
        return NextResponse.json({ error: 'Access failed' }, { status: 500 });
    }
}
