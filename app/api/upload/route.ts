import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '@/lib/supabase';
import { convertOfficeToPDF, isConvertibleOfficeDocument } from '@/lib/pdf-converter';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const url = formData.get('url') as string | null;
        const name = formData.get('name') as string | null;

        // Validate: must have either file or URL
        if (!file && !url) {
            return NextResponse.json({ error: 'No file or URL provided' }, { status: 400 });
        }

        const fileId = uuidv4();

        // Handle file upload
        if (file) {
            const fileExtension = file.name.split('.').pop() || '';
            const storedFileName = `${fileId}.${fileExtension}`;

            // Upload original file to Supabase Storage
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

            // Check if this is an Office document that should be converted to PDF
            let pdfPath: string | null = null;
            if (isConvertibleOfficeDocument(file.type)) {
                try {
                    console.log(`Converting ${file.name} to PDF...`);

                    // Read file buffer
                    const arrayBuffer = await file.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);

                    // Convert to PDF
                    const pdfBuffer = await convertOfficeToPDF(buffer);

                    // Upload PDF version
                    const pdfFileName = `${fileId}.pdf`;
                    const { error: pdfUploadError } = await supabaseAdmin
                        .storage
                        .from('uploaded-files')
                        .upload(pdfFileName, pdfBuffer, {
                            contentType: 'application/pdf',
                            upsert: false
                        });

                    if (pdfUploadError) {
                        console.error('PDF upload error:', pdfUploadError);
                        // Don't fail the entire upload, just log the error
                    } else {
                        pdfPath = pdfFileName;
                        console.log(`PDF conversion successful: ${pdfFileName}`);
                    }
                } catch (conversionError) {
                    console.error('PDF conversion failed:', conversionError);
                    // Continue without PDF version
                }
            }

            // Save metadata to database
            const { error: dbError } = await supabaseAdmin
                .from('files')
                .insert({
                    id: fileId,
                    name: file.name,
                    path: storedFileName,
                    mime_type: file.type,
                    size: file.size,
                    type: 'file',
                    pdf_path: pdfPath
                });

            if (dbError) {
                console.error('Database insert error:', dbError);
                // Cleanup uploaded files if DB insert fails
                const filesToRemove = [storedFileName];
                if (pdfPath) filesToRemove.push(pdfPath);
                await supabaseAdmin.storage.from('uploaded-files').remove(filesToRemove);
                throw dbError;
            }

            return NextResponse.json({
                success: true,
                fileId,
                fileName: file.name,
                pdfConverted: !!pdfPath
            });
        }

        // Handle external URL
        if (url) {
            // Validate URL format
            try {
                const urlObj = new URL(url);
                if (!['http:', 'https:'].includes(urlObj.protocol)) {
                    return NextResponse.json({ error: 'URL must use HTTP or HTTPS protocol' }, { status: 400 });
                }
            } catch (e) {
                return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
            }

            if (!name) {
                return NextResponse.json({ error: 'Name is required for URL links' }, { status: 400 });
            }

            // Save to database
            const { error: dbError } = await supabaseAdmin
                .from('files')
                .insert({
                    id: fileId,
                    name: name,
                    type: 'url',
                    external_url: url,
                    path: '', // Empty string instead of null (NOT NULL constraint)
                    mime_type: 'text/uri-list', // Use standard MIME type for URLs
                    size: 0 // 0 instead of null (NOT NULL constraint)
                });

            if (dbError) {
                console.error('Database insert error:', dbError);
                throw dbError;
            }

            return NextResponse.json({ success: true, fileId, fileName: name });
        }

        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}

