import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { fileId, viewerEmail, pageNumber, durationSeconds } = body;

        if (!fileId || !viewerEmail || pageNumber === undefined || !durationSeconds) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('page_views')
            .insert({
                file_id: fileId,
                viewer_email: viewerEmail,
                page_number: pageNumber,
                duration_seconds: durationSeconds
            });

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Page track error:', error);
        return NextResponse.json({ error: 'Failed to track page view' }, { status: 500 });
    }
}

