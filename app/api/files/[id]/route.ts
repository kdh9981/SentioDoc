import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = user.email;
    const { id: fileId } = await params;
    const body = await request.json();
    const { slug, password, removePassword, expiresAt, requireEmail, requireName, allowDownload, allowPrint, name, isFavorite, ogTitle, ogDescription, ogImage, customLogo, primaryColor, showBranding } = body;

    // Verify ownership
    const { data: file } = await supabaseAdmin
      .from('files')
      .select('user_email')
      .eq('id', fileId)
      .single();

    if (!file || file.user_email !== userEmail) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Get user tier
    const { data: userData } = await supabaseAdmin
      .from('authorized_users')
      .select('tier')
      .eq('email', userEmail)
      .single();

    const tier = userData?.tier || 'free';

    // Check tier for password/expiration features
    if ((password || expiresAt) && tier === 'free') {
      return NextResponse.json(
        { error: 'Password protection and link expiration require Starter or Pro plan' },
        { status: 403 }
      );
    }

    // Build update object
    const updates: Record<string, unknown> = {};

    if (name !== undefined) {
      updates.name = name;
    }

    if (slug !== undefined) {
      // Validate slug
      if (slug && !/^[a-z0-9-]+$/.test(slug)) {
        return NextResponse.json({ error: 'Invalid slug format' }, { status: 400 });
      }
      // Check slug uniqueness
      if (slug) {
        const { data: existing } = await supabaseAdmin
          .from('files')
          .select('id')
          .eq('slug', slug)
          .neq('id', fileId)
          .single();

        if (existing) {
          return NextResponse.json({ error: 'Slug already in use' }, { status: 409 });
        }
      }
      updates.slug = slug || null;
    }

    if (password) {
      updates.password_hash = await bcrypt.hash(password, 10);
    }

    if (removePassword) {
      updates.password_hash = null;
    }

    if (expiresAt !== undefined) {
      updates.expires_at = expiresAt ? new Date(expiresAt).toISOString() : null;
    }

    if (requireEmail !== undefined) {
      updates.require_email = requireEmail;
    }

    if (requireName !== undefined) {
      updates.require_name = requireName;
    }

    if (allowDownload !== undefined) {
      updates.allow_download = allowDownload;
    }

    if (allowPrint !== undefined) {
      updates.allow_print = allowPrint;
    }

    if (isFavorite !== undefined) {
      updates.is_favorite = isFavorite;
    }

    if (ogTitle !== undefined) updates.og_title = ogTitle;
    if (ogDescription !== undefined) updates.og_description = ogDescription;
    if (ogImage !== undefined) updates.og_image = ogImage;
    if (customLogo !== undefined) updates.custom_logo = customLogo;
    if (primaryColor !== undefined) updates.primary_color = primaryColor;
    if (showBranding !== undefined) updates.show_branding = showBranding;

    // Update file
    const { error } = await supabaseAdmin
      .from('files')
      .update(updates)
      .eq('id', fileId);

    if (error) {
      console.error('Update error:', error);
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('=== DELETE API CALLED ===');

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      console.log('DELETE: Unauthorized - no user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = user.email;
    const { id: fileId } = await params;
    console.log('DELETE: fileId =', fileId);

    // Verify ownership and get file info
    const { data: file } = await supabaseAdmin
      .from('files')
      .select('user_email, path, type')
      .eq('id', fileId)
      .single();

    if (!file || file.user_email !== userEmail) {
      console.log('DELETE: File not found or not owner');
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    console.log('DELETE: File found, type =', file.type);

    // Step 1: Mark access_logs WITH valid viewer_email as link_deleted = true
    // Valid = not null AND not empty string
    const { error: markDeletedError } = await supabaseAdmin
      .from('access_logs')
      .update({ link_deleted: true })
      .eq('file_id', fileId)
      .not('viewer_email', 'is', null)
      .neq('viewer_email', '');

    if (markDeletedError) {
      console.error('DELETE: Error marking link_deleted:', markDeletedError);
    } else {
      console.log('DELETE: Marked access_logs with viewer_email as link_deleted=true');
    }

    // Step 2: Delete access_logs WITHOUT valid viewer_email (anonymous views - no contact value)
    // First get IDs of rows to delete, then delete them
    const { data: anonLogs, error: fetchError } = await supabaseAdmin
      .from('access_logs')
      .select('id, viewer_email')
      .eq('file_id', fileId);

    console.log('DELETE Step 2: Fetched logs for file_id', fileId);
    console.log('DELETE Step 2: fetchError:', fetchError);
    console.log('DELETE Step 2: anonLogs count:', anonLogs?.length);
    console.log('DELETE Step 2: anonLogs data:', JSON.stringify(anonLogs, null, 2));

    if (anonLogs && anonLogs.length > 0) {
      // Filter to find anonymous logs (null, empty, or whitespace-only email)
      const anonIds = anonLogs
        .filter(log => {
          const email = log.viewer_email;
          const isEmpty = !email || email.trim() === '';
          console.log(`DELETE Step 2: Log id=${log.id}, email="${email}", isEmpty=${isEmpty}`);
          return isEmpty;
        })
        .map(log => log.id);

      console.log('DELETE Step 2: anonIds to delete:', anonIds);

      if (anonIds.length > 0) {
        const { error: deleteAnonError } = await supabaseAdmin
          .from('access_logs')
          .delete()
          .in('id', anonIds);

        if (deleteAnonError) {
          console.error('DELETE: Error deleting anonymous logs:', deleteAnonError);
        } else {
          console.log('DELETE: Deleted', anonIds.length, 'anonymous access_logs');
        }
      } else {
        console.log('DELETE Step 2: No anonymous logs to delete');
      }
    } else {
      console.log('DELETE Step 2: No logs found for this file_id');
    }

    // Step 3: Delete from storage if it's an uploaded file (not URL/track site)
    if (file.path && file.type !== 'url') {
      const { error: storageError } = await supabaseAdmin.storage
        .from('uploaded-files')
        .remove([file.path]);

      if (storageError) {
        console.error('DELETE: Storage delete error:', storageError);
      } else {
        console.log('DELETE: Deleted file from storage');
      }
    }

    // Step 4: Delete the file record from files table
    const { error: deleteError } = await supabaseAdmin
      .from('files')
      .delete()
      .eq('id', fileId);

    if (deleteError) {
      console.error('DELETE: File record delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }

    console.log('DELETE: File record deleted from files table');
    console.log('=== DELETE COMPLETED SUCCESSFULLY ===');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
