import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: paramId } = await params;

        // Check if paramId is a UUID
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(paramId);

        // Build query based on ID type
        let query = supabaseAdmin
            .from('files')
            .select('path, mime_type, name')

        if (isUUID) {
            query = query.eq('id', paramId);
        } else {
            query = query.eq('slug', paramId);
        }

        const { data: fileRecord, error: dbError } = await query.single();

        if (dbError || !fileRecord) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        // Get signed URL with download disposition
        const { data: signedUrlData, error: urlError } = await supabaseAdmin
            .storage
            .from('uploaded-files')
            .createSignedUrl(fileRecord.path, 3600, {
                download: fileRecord.name || 'download', // Forces download with filename
            });

        if (urlError || !signedUrlData) {
            console.error('Failed to generate signed URL:', urlError);
            return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 });
        }

        // Return the signed URL for client to use
        return NextResponse.json({
            downloadUrl: signedUrlData.signedUrl,
            fileName: fileRecord.name,
        });
    } catch (error) {
        console.error('Download URL error:', error);
        return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 });
    }
}
