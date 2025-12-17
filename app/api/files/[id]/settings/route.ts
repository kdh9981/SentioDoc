import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        console.log('=== SETTINGS UPDATE ===');
        console.log('File ID:', id);

        // Verify user owns this file
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) {
            console.log('Unauthorized - no user');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('User:', user.email);

        // Check file ownership
        const { data: file, error: fileError } = await supabaseAdmin
            .from('files')
            .select('id, user_email')
            .eq('id', id)
            .single();

        if (fileError || !file) {
            console.log('File not found:', fileError);
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        if (file.user_email !== user.email) {
            console.log('Not file owner');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Parse settings from request body
        const body = await request.json();
        console.log('Settings received:', body);

        const {
            requireEmail,
            requireName,
            allowDownload,
            allowPrint,
            password,
            expiresAt,
        } = body;

        // Build update object - convert camelCase to snake_case
        const updateData: Record<string, any> = {};

        if (typeof requireEmail === 'boolean') {
            updateData.require_email = requireEmail;
        }
        if (typeof requireName === 'boolean') {
            updateData.require_name = requireName;
        }
        if (typeof allowDownload === 'boolean') {
            updateData.allow_download = allowDownload;
        }
        if (typeof allowPrint === 'boolean') {
            updateData.allow_print = allowPrint;
        }

        // Password - empty string means remove password
        if (password !== undefined) {
            updateData.password_hash = password || null;
        }

        // Expiration - empty string means remove expiration
        if (expiresAt !== undefined) {
            if (expiresAt) {
                const date = new Date(expiresAt);
                updateData.expires_at = date.toISOString();
            } else {
                updateData.expires_at = null;
            }
        }

        console.log('Update data:', updateData);

        // Update the file
        const { error: updateError } = await supabaseAdmin
            .from('files')
            .update(updateData)
            .eq('id', id);

        if (updateError) {
            console.error('Update error:', updateError);
            return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
        }

        console.log('Settings updated successfully');
        return NextResponse.json({ success: true, updated: updateData });
    } catch (error) {
        console.error('Settings update error:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}

// Also support GET to fetch current settings
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: file, error } = await supabaseAdmin
            .from('files')
            .select('require_email, require_name, allow_download, allow_print, password_hash, expires_at')
            .eq('id', id)
            .eq('user_email', user.email)
            .single();

        if (error || !file) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        return NextResponse.json({
            requireEmail: file.require_email === true,
            requireName: file.require_name === true,
            allowDownload: file.allow_download === true,
            allowPrint: file.allow_print === true,
            hasPassword: !!file.password_hash,
            expiresAt: file.expires_at || '',
        });
    } catch (error) {
        console.error('Settings fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}
