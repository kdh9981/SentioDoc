import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Get file info first
        const { data: file, error: fetchError } = await supabaseAdmin
            .from('files')
            .select('path')
            .eq('id', id)
            .single();

        if (fetchError || !file) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        // Delete from Storage
        const { error: storageError } = await supabaseAdmin
            .storage
            .from('uploaded-files')
            .remove([file.path]);

        if (storageError) {
            console.error('Storage delete error:', storageError);
        }

        // Soft Delete from Database (keep record, mark as deleted)
        const { error: dbError } = await supabaseAdmin
            .from('files')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);

        if (dbError) {
            throw dbError;
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete error:', error);
        return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { slug } = body;

        if (!slug) {
            return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
        }

        // Validate slug format
        if (!/^[a-z0-9-]+$/.test(slug)) {
            return NextResponse.json({ error: 'Invalid slug format. Use lowercase letters, numbers, and hyphens only.' }, { status: 400 });
        }

        // Check uniqueness (only among non-deleted files)
        const { data: existing } = await supabaseAdmin
            .from('files')
            .select('id')
            .eq('slug', slug)
            .neq('id', id) // Exclude current file
            .is('deleted_at', null) // Only check non-deleted files
            .single();

        if (existing) {
            return NextResponse.json({ error: 'Link name already taken' }, { status: 409 });
        }

        // Update
        const { error } = await supabaseAdmin
            .from('files')
            .update({ slug })
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Update error:', error);
        return NextResponse.json({ error: 'Failed to update file', details: error.message || String(error) }, { status: 500 });
    }
}
