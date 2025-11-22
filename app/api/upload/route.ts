import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const fileId = uuidv4();
        const fileExtension = file.name.split('.').pop() || '';
        const storedFileName = `${fileId}.${fileExtension}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabaseAdmin
            .storage
            .from('uploaded-files')
            .upload(storedFileName, file, {
                contentType: file.type,
                upsert: false
            });

        if (uploadError) {
            console.error('Storage upload error:', uploadError);
            throw uploadError;
        }

        // Save metadata to database
        const { error: dbError } = await supabaseAdmin
            .from('files')
            .insert({
                id: fileId,
                name: file.name,
                path: storedFileName,
                mime_type: file.type,
                size: file.size
            });

        if (dbError) {
            console.error('Database insert error:', dbError);
            // Cleanup uploaded file if DB insert fails
            await supabaseAdmin.storage.from('uploaded-files').remove([storedFileName]);
            throw dbError;
        }

        return NextResponse.json({ success: true, fileId, fileName: file.name });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}

