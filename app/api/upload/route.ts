import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '@/lib/supabase';
import { convertOfficeToPDF, isOfficeDocument } from '@/lib/pdf-converter';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const url = formData.get('url') as string | null;
        const name = formData.get('name') as string | null;
        const customDomainId = formData.get('customDomainId') as string | null;
        const customSlug = formData.get('slug') as string | null; // NEW: Custom slug from user

        // Validate: must have either file or URL
        if (!file && !url) {
            return NextResponse.json({ error: 'No file or URL provided' }, { status: 400 });
        }

        const fileId = uuidv4();

        // Generate a random slug (fallback)
        const generateSlug = (length = 6) => {
            const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let slug = '';
            for (let i = 0; i < length; i++) {
                slug += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return slug;
        };

        // Use custom slug or generate random one
        let slug = customSlug || generateSlug();

        // Validate slug format if provided
        if (customSlug) {
            // Only allow lowercase letters, numbers, and hyphens
            if (!/^[a-z0-9-]+$/.test(customSlug)) {
                return NextResponse.json({
                    error: 'Invalid slug format. Use lowercase letters, numbers, and hyphens only.'
                }, { status: 400 });
            }

            // Check if slug is already taken
            const { data: existingFile } = await supabaseAdmin
                .from('files')
                .select('id')
                .eq('slug', customSlug)
                .single();

            if (existingFile) {
                return NextResponse.json({
                    error: 'This link name is already taken. Please choose another.'
                }, { status: 409 });
            }
        }

        // Handle file upload
        if (file) {
            const fileExtension = file.name.split('.').pop() || '';
            const storedFileName = `${fileId}.${fileExtension}`;
            let pdfPath: string | null = null;

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

            // Check if Office document and convert to PDF
            if (isOfficeDocument(file.type)) {
                try {
                    console.log(`Processing Office document: ${file.name}`);
                    const arrayBuffer = await file.arrayBuffer();
                    const fileBuffer = Buffer.from(arrayBuffer);

                    const pdfBuffer = await convertOfficeToPDF(fileBuffer, file.name);

                    if (pdfBuffer) {
                        const pdfFileName = `${fileId}-converted.pdf`;

                        // Upload PDF to Supabase Storage
                        const { error: pdfUploadError } = await supabaseAdmin
                            .storage
                            .from('uploaded-files')
                            .upload(pdfFileName, pdfBuffer, {
                                contentType: 'application/pdf',
                                upsert: false
                            });

                        if (pdfUploadError) {
                            console.error('PDF upload error:', pdfUploadError);
                        } else {
                            console.log(`PDF uploaded successfully: ${pdfFileName}`);
                            pdfPath = pdfFileName;
                        }
                    }
                } catch (conversionError) {
                    console.error('PDF conversion process failed:', conversionError);
                    // Continue without PDF path - viewer will fallback to download
                }
            }

            // Save metadata to database
            const { error: dbError } = await supabaseAdmin
                .from('files')
                .insert({
                    id: fileId,
                    name: file.name,
                    path: storedFileName,
                    pdf_path: pdfPath, // Save PDF path if conversion succeeded
                    mime_type: file.type,
                    size: file.size,
                    type: 'file',
                    custom_domain_id: customDomainId || null,
                    slug: slug
                });

            if (dbError) {
                console.error('Database insert error:', dbError);
                // Cleanup uploaded file if DB insert fails
                await supabaseAdmin.storage.from('uploaded-files').remove([storedFileName]);
                if (pdfPath) {
                    await supabaseAdmin.storage.from('uploaded-files').remove([pdfPath]);
                }
                throw dbError;
            }

            return NextResponse.json({ success: true, fileId, fileName: file.name, slug });
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
                    size: 0, // 0 instead of null (NOT NULL constraint)
                    custom_domain_id: customDomainId || null,
                    slug: slug
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

