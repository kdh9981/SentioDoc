import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';
import { promises as dns } from 'dns';

// DELETE /api/domains/[id] - Delete a custom domain
export async function DELETE(
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
        const { id } = await params;

        // Check ownership
        const { data: domain } = await supabaseAdmin
            .from('custom_domains')
            .select('*')
            .eq('id', id)
            .eq('user_email', userEmail)
            .single();

        if (!domain) {
            return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
        }

        // Delete domain
        const { error } = await supabaseAdmin
            .from('custom_domains')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete domain error:', error);
        return NextResponse.json({ error: 'Failed to delete domain' }, { status: 500 });
    }
}

// PATCH /api/domains/[id] - Update domain (set as default)
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
        const { id } = await params;
        const body = await request.json();
        const { setAsDefault } = body;

        // Check ownership
        const { data: domain } = await supabaseAdmin
            .from('custom_domains')
            .select('*')
            .eq('id', id)
            .eq('user_email', userEmail)
            .single();

        if (!domain) {
            return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
        }

        if (setAsDefault) {
            // Remove default from all user's domains
            await supabaseAdmin
                .from('custom_domains')
                .update({ is_default: false })
                .eq('user_email', userEmail);

            // Set this domain as default
            const { error } = await supabaseAdmin
                .from('custom_domains')
                .update({ is_default: true })
                .eq('id', id);

            if (error) throw error;
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Update domain error:', error);
        return NextResponse.json({ error: 'Failed to update domain' }, { status: 500 });
    }
}
