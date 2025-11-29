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
            .select('path, mime_type, name, pdf_path')

        if (isUUID) {
            query = query.eq('id', paramId);
        } else {
            query = query.eq('slug', paramId);
        }

        const { data: fileRecord, error: dbError } = await query.single();

        if (dbError || !fileRecord) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        // Check if PDF version requested
        const { searchParams } = new URL(request.url);
        const usePDF = searchParams.get('pdf') === 'true';

        // Determine which file path to use
        // Use PDF path if requested and available, otherwise fallback to original path
        const filePath = (usePDF && fileRecord.pdf_path) ? fileRecord.pdf_path : fileRecord.path;

        // Get signed URL from Supabase Storage
        const { data: signedUrlData, error: urlError } = await supabaseAdmin
            .storage
            .from('uploaded-files')
            .createSignedUrl(filePath, 3600); // 1 hour expiry

        if (urlError || !signedUrlData) {
            console.error('Failed to generate signed URL:', urlError);
            return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 });
        }

        // Redirect to signed URL
        return NextResponse.redirect(signedUrlData.signedUrl);
    } catch (error) {
        console.error('File serve error details:', error);
        return NextResponse.json({ error: 'Failed to serve file', details: String(error) }, { status: 500 });
    }
}



