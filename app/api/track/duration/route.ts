import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { fileId, viewerEmail, durationSeconds } = body;

        if (!fileId || !viewerEmail || durationSeconds === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Update the most recent access log for this viewer/file combination
        const { error } = await supabaseAdmin
            .from('access_logs')
            .update({ duration_seconds: durationSeconds })
            .eq('file_id', fileId)
            .eq('viewer_email', viewerEmail)
            .is('duration_seconds', null)
            .order('accessed_at', { ascending: false })
            .limit(1);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Duration tracking error:', error);
        return NextResponse.json({ error: 'Failed to track duration' }, { status: 500 });
    }
}
