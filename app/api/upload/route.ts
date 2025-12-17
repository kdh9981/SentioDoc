import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase';
import { convertOfficeToPDF, isOfficeDocument } from '@/lib/pdf-converter';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { canCreateLink, canUploadFile } from '@/lib/usageTracking';
import { PDFDocument } from 'pdf-lib';
import * as XLSX from 'xlsx';
import * as mm from 'music-metadata';

// Helper: Extract page count from PDF buffer
async function extractPdfPageCount(buffer: ArrayBuffer | Buffer): Promise<number | null> {
    try {
        const pdfDoc = await PDFDocument.load(buffer);
        return pdfDoc.getPageCount();
    } catch (error) {
        console.error('Failed to extract PDF page count:', error);
        return null;
    }
}

// Helper: Extract sheet count from Excel buffer
async function extractExcelSheetCount(buffer: ArrayBuffer): Promise<number | null> {
    try {
        const workbook = XLSX.read(buffer, { type: 'array' });
        return workbook.SheetNames.length;
    } catch (error) {
        console.error('Failed to extract Excel sheet count:', error);
        return null;
    }
}

// Helper: Check if file is Excel
function isExcelDocument(mimeType: string): boolean {
    return mimeType.includes('spreadsheet') ||
           mimeType.includes('excel') ||
           mimeType === 'application/vnd.ms-excel' ||
           mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
}

// Helper: Check if file is a multi-page document (PDF or Office)
function isMultiPageDocument(mimeType: string): boolean {
    return mimeType === 'application/pdf' || isOfficeDocument(mimeType);
}

// Helper: Check if file is a video
function isVideoFile(mimeType: string): boolean {
    return mimeType.startsWith('video/');
}

// Helper: Check if file is an audio
function isAudioFile(mimeType: string): boolean {
    return mimeType.startsWith('audio/');
}

// Helper: Extract duration from audio/video buffer
async function extractMediaDuration(buffer: Buffer, mimeType: string): Promise<number | null> {
    try {
        const metadata = await mm.parseBuffer(buffer, mimeType);
        const duration = metadata.format.duration;
        if (duration !== undefined && duration > 0) {
            return Math.round(duration); // Return seconds as integer
        }
        return null;
    } catch (error) {
        console.error('Failed to extract media duration:', error);
        return null;
    }
}

export async function POST(request: NextRequest) {
    console.log('=== UPLOAD API CALLED ===');
    console.log('Content-Type:', request.headers.get('content-type'));

    try {
        // Get user session
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();

        console.log('User:', user?.email);

        if (!user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userEmail = user.email;

        // Get user's tier
        const { data: userData } = await supabaseAdmin
            .from('authorized_users')
            .select('tier')
            .eq('email', userEmail)
            .single();

        const tier = userData?.tier || 'free';
        console.log('User tier:', tier);

        // Check link limit
        const linkCheck = await canCreateLink(userEmail, tier);
        if (!linkCheck.allowed) {
            return NextResponse.json({ error: linkCheck.reason }, { status: 403 });
        }

        // Parse FormData with detailed error
        console.log('Parsing FormData...');
        let formData;
        try {
            formData = await request.formData();
            console.log('FormData parsed successfully');
        } catch (parseError: any) {
            console.error('FormData parse error:', parseError);
            console.error('Error message:', parseError.message);
            return NextResponse.json({
                error: `Failed to parse form data: ${parseError.message}`
            }, { status: 400 });
        }

        // Log FormData contents
        console.log('FormData entries:');
        for (const [key, value] of formData.entries()) {
            if (value instanceof File) {
                console.log(`  ${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
            } else {
                console.log(`  ${key}: ${value}`);
            }
        }

        const file = formData.get('file') as File | null;
        const url = formData.get('url') as string | null;
        const name = formData.get('name') as string | null;
        const customDomainId = formData.get('customDomainId') as string | null;
        const customSlug = formData.get('slug') as string | null;

        // Access control settings
        const requireEmail = formData.get('requireEmail') === 'true';
        const requireName = formData.get('requireName') === 'true';
        const allowDownload = formData.get('allowDownload') !== 'false'; // Default true
        const allowPrint = formData.get('allowPrint') !== 'false'; // Default true
        const password = formData.get('password') as string | null;
        const expiresAt = formData.get('expiresAt') as string | null;

        // Validate: must have either file or URL
        if (!file && !url) {
            return NextResponse.json({ error: 'No file or URL provided' }, { status: 400 });
        }

        // Check file size and storage limit
        if (file) {
            const fileCheck = await canUploadFile(userEmail, tier, file.size);
            if (!fileCheck.allowed) {
                return NextResponse.json({ error: fileCheck.reason }, { status: 403 });
            }
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
            let totalPages: number | null = null;
            let videoDurationSeconds: number | null = null;

            // Get file buffer for processing
            const fileArrayBuffer = await file.arrayBuffer();
            const fileBuffer = Buffer.from(fileArrayBuffer);

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

            // ============================================
            // EXTRACT PAGE/SLIDE/SHEET COUNT
            // ============================================

            // 1. Native PDF - extract directly
            if (file.type === 'application/pdf') {
                totalPages = await extractPdfPageCount(fileArrayBuffer);
                console.log(`[PDF] Extracted page count: ${totalPages}`);
            }

            // 2. Excel files - count sheets
            else if (isExcelDocument(file.type)) {
                totalPages = await extractExcelSheetCount(fileArrayBuffer);
                console.log(`[Excel] Extracted sheet count: ${totalPages}`);
            }

            // 3. Office documents (Word, PowerPoint) - convert to PDF first, then count
            else if (isOfficeDocument(file.type)) {
                try {
                    console.log(`Processing Office document: ${file.name}`);

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

                            // Extract page count from converted PDF
                            totalPages = await extractPdfPageCount(pdfBuffer);
                            console.log(`[Office→PDF] Extracted page count: ${totalPages}`);
                        }
                    }
                } catch (conversionError) {
                    console.error('PDF conversion process failed:', conversionError);
                    // Continue without PDF path - viewer will fallback to download
                }
            }

            // ============================================
            // EXTRACT MEDIA DURATION (Video/Audio)
            // ============================================

            // 4. Video files - extract duration
            else if (isVideoFile(file.type)) {
                videoDurationSeconds = await extractMediaDuration(fileBuffer, file.type);
                console.log(`[Video] Extracted duration: ${videoDurationSeconds} seconds`);
            }

            // 5. Audio files - extract duration
            else if (isAudioFile(file.type)) {
                videoDurationSeconds = await extractMediaDuration(fileBuffer, file.type);
                console.log(`[Audio] Extracted duration: ${videoDurationSeconds} seconds`);
            }

            // Save metadata to database
            const { error: dbError } = await supabaseAdmin
                .from('files')
                .insert({
                    id: fileId,
                    name: file.name,
                    path: storedFileName,
                    pdf_path: pdfPath,
                    total_pages: totalPages, // Store the extracted page/slide/sheet count
                    video_duration_seconds: videoDurationSeconds, // Store media duration
                    mime_type: file.type,
                    size: file.size,
                    type: 'file',
                    custom_domain_id: customDomainId || null,
                    slug: slug,
                    user_email: userEmail,
                    // Access control settings
                    require_email: requireEmail,
                    require_name: requireName,
                    allow_download: allowDownload,
                    allow_print: allowPrint,
                    password_hash: password ? await bcrypt.hash(password, 10) : null,
                    expires_at: expiresAt || null
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

            console.log(`File uploaded successfully: ${file.name}, ID: ${fileId}, Pages: ${totalPages}, Duration: ${videoDurationSeconds}s`);
            return NextResponse.json({ success: true, fileId, fileName: file.name, slug, totalPages, videoDurationSeconds });
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
                    path: '',
                    mime_type: 'text/uri-list',
                    size: 0,
                    custom_domain_id: customDomainId || null,
                    slug: slug,
                    user_email: userEmail,
                    require_email: requireEmail,
                    require_name: requireName,
                    allow_download: allowDownload,
                    allow_print: allowPrint,
                    password_hash: password ? await bcrypt.hash(password, 10) : null,
                    expires_at: expiresAt || null
                });

            if (dbError) {
                console.error('Database insert error:', dbError);
                throw dbError;
            }

            return NextResponse.json({ success: true, fileId, fileName: name });
        }

        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    } catch (error: any) {
        console.error('Upload error:', error);
        const errorMessage = error?.message || error?.details || 'Upload failed';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
