import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';

// GET - Get all contacts with their tags
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id || !user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all contact_tags for this user with tag details
    const { data: contactTags, error } = await supabaseAdmin
      .from('contact_tags')
      .select(`
        contact_email,
        tags (
          id,
          name,
          emoji,
          color
        )
      `)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching contact tags:', error);
      return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
    }

    // Group tags by contact_email (base64 encoded for consistency)
    const contactTagsMap: Record<string, Array<{ id: string; name: string; emoji: string; color: string }>> = {};

    (contactTags || []).forEach(ct => {
      if (ct.tags && ct.contact_email) {
        // Use base64 encoded email as key (matching contact ID format)
        const contactId = Buffer.from(ct.contact_email).toString('base64');
        if (!contactTagsMap[contactId]) {
          contactTagsMap[contactId] = [];
        }
        contactTagsMap[contactId].push({
          id: (ct.tags as any).id,
          name: (ct.tags as any).name,
          emoji: (ct.tags as any).emoji || '🏷️',
          color: (ct.tags as any).color || 'blue',
        });
      }
    });

    return NextResponse.json({ contactTagsMap });
  } catch (error) {
    console.error('Contacts with tags error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
