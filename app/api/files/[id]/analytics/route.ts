import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Fetch access logs
        const { data: logs, error: logsError } = await supabaseAdmin
            .from('access_logs')
            .select('viewer_name, viewer_email, accessed_at, country, ip_address')
            .eq('file_id', id)
            .order('accessed_at', { ascending: false });

        if (logsError) throw logsError;

        // Fetch page stats - need to manually aggregate since Supabase doesn't support AVG in select
        const { data: pageViewsData, error: pageError } = await supabaseAdmin
            .from('page_views')
            .select('page_number, duration_seconds')
            .eq('file_id', id);

        if (pageError) throw pageError;

        // Manually aggregate page stats
        const pageStatsMap: { [key: number]: { totalDuration: number, count: number } } = {};
        pageViewsData?.forEach(view => {
            if (!pageStatsMap[view.page_number]) {
                pageStatsMap[view.page_number] = { totalDuration: 0, count: 0 };
            }
            pageStatsMap[view.page_number].totalDuration += view.duration_seconds;
            pageStatsMap[view.page_number].count += 1;
        });

        const pageStats = Object.entries(pageStatsMap).map(([pageNumber, stats]) => ({
            pageNumber: parseInt(pageNumber),
            avgDuration: stats.totalDuration / stats.count,
            viewCount: stats.count
        })).sort((a, b) => a.pageNumber - b.pageNumber);

        // Transform logs to match expected format
        const formattedLogs = logs?.map(log => ({
            viewerName: log.viewer_name,
            viewerEmail: log.viewer_email,
            accessedAt: log.accessed_at,
            country: log.country,
            ipAddress: log.ip_address
        })) || [];

        return NextResponse.json({ logs: formattedLogs, pageStats });
    } catch (error) {
        console.error('Fetch analytics error:', error);
        return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }
}

