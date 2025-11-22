import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
    try {
        // Fetch recent activity (last 50 logs) joined with file names
        const { data: recentActivity, error: activityError } = await supabaseAdmin
            .from('access_logs')
            .select(`
                viewer_name,
                viewer_email,
                country,
                accessed_at,
                files (
                    name,
                    id
                )
            `)
            .order('accessed_at', { ascending: false })
            .limit(1000);

        if (activityError) throw activityError;

        // Transform the data to match expected format
        const formattedActivity = recentActivity?.map(log => ({
            viewerName: log.viewer_name,
            viewerEmail: log.viewer_email,
            country: log.country,
            accessedAt: log.accessed_at,
            fileName: (log.files as any)?.name,
            fileId: (log.files as any)?.id
        })) || [];

        const { count: totalViews } = await supabaseAdmin
            .from('access_logs')
            .select('*', { count: 'exact', head: true });

        // Get all viewer emails to count unique
        const { data: allViewersData } = await supabaseAdmin
            .from('access_logs')
            .select('viewer_email');

        const uniqueViewers = new Set(allViewersData?.map(v => v.viewer_email)).size;

        const { data: topCountryData } = await supabaseAdmin
            .from('access_logs')
            .select('country')
            .not('country', 'is', null)
            .limit(1000);

        // Count countries manually
        const countryCounts: { [key: string]: number } = {};
        topCountryData?.forEach(row => {
            const country = row.country;
            countryCounts[country] = (countryCounts[country] || 0) + 1;
        });

        const topCountry = Object.keys(countryCounts).length > 0
            ? Object.entries(countryCounts).sort((a, b) => b[1] - a[1])[0][0]
            : 'N/A';

        // Create sorted country ranking array for chart
        const countryRanking = Object.entries(countryCounts)
            .sort((a, b) => b[1] - a[1]) // Most visited first
            .map(([country, count]) => ({ country, count }));

        return NextResponse.json({
            recentActivity: formattedActivity,
            stats: {
                totalViews: totalViews || 0,
                uniqueViewers: uniqueViewers,
                topCountry,
                countryRanking // Add country ranking data
            }
        });

    } catch (error) {
        console.error('Global analytics error:', error);
        return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }
}

