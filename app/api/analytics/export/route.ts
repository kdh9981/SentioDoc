import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';
import { getTierLimits } from '@/lib/tierLimits';

// Escape CSV fields
function escapeCSV(field: string | number | boolean | null | undefined): string {
  if (field === null || field === undefined) return '';
  const str = String(field);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = user.email;

    // Get user's tier
    const { data: userData } = await supabaseAdmin
      .from('authorized_users')
      .select('id, tier')
      .eq('email', userEmail)
      .single();

    const tier = userData?.tier || 'free';
    const tierLimits = getTierLimits(tier);

    // Check if user can export
    if (!tierLimits.csvExport) {
      return NextResponse.json(
        { error: 'CSV export requires Starter or Pro plan' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const exportType = searchParams.get('type') || 'analytics';
    const fileId = searchParams.get('file_id');

    // Calculate date filter based on tier
    const historyDate = new Date();
    historyDate.setDate(historyDate.getDate() - tierLimits.analyticsHistoryDays);

    // Export contacts
    if (exportType === 'contacts') {
      return await exportContacts(userData?.id, tier, tierLimits.fullCsvExport);
    }

    // Export analytics (default)
    return await exportAnalytics(userEmail, fileId, historyDate, tierLimits.fullCsvExport);
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

async function exportContacts(userId: string | undefined, tier: string, fullExport: boolean) {
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const { data: contacts } = await supabaseAdmin
    .from('contacts')
    .select('*')
    .eq('user_id', userId)
    .order('last_seen_at', { ascending: false });

  if (!contacts || contacts.length === 0) {
    return new NextResponse('No contacts to export', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  // Basic headers for Starter tier
  let headers = ['Email', 'Name', 'Company', 'Total Views', 'Avg Engagement', 'First Seen', 'Last Seen'];

  // Full headers for Pro tier
  if (fullExport) {
    headers = [
      ...headers,
      'Files Viewed',
      'Total Time (seconds)',
      'Hot Lead',
      'Notes',
      'Tags',
    ];
  }

  const rows = contacts.map(contact => {
    const baseRow = [
      contact.email,
      contact.name || '',
      contact.company || '',
      contact.total_views || 0,
      contact.avg_engagement || 0,
      contact.first_seen_at || '',
      contact.last_seen_at || '',
    ];

    if (fullExport) {
      return [
        ...baseRow,
        contact.files_viewed?.length || 0,
        contact.total_time_seconds || 0,
        contact.is_hot_lead ? 'Yes' : 'No',
        contact.notes || '',
        (contact.tags || []).join('; '),
      ];
    }

    return baseRow;
  });

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(escapeCSV).join(',')),
  ].join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="contacts-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}

async function exportAnalytics(
  userEmail: string,
  fileId: string | null,
  historyDate: Date,
  fullExport: boolean
) {
  // Get user's file IDs
  let fileIds: string[] = [];
  if (fileId) {
    // Verify user owns this file
    const { data: file } = await supabaseAdmin
      .from('files')
      .select('id')
      .eq('id', fileId)
      .eq('user_email', userEmail)
      .single();

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    fileIds = [fileId];
  } else {
    const { data: userFiles } = await supabaseAdmin
      .from('files')
      .select('id')
      .eq('user_email', userEmail);
    fileIds = userFiles?.map(f => f.id) || [];
  }

  if (fileIds.length === 0) {
    return new NextResponse('No data to export', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  // Basic select for Starter
  let selectFields = `
    viewer_name,
    viewer_email,
    accessed_at,
    file_id,
    files!inner(original_name)
  `;

  // Full select for Pro
  if (fullExport) {
    selectFields = `
      viewer_name,
      viewer_email,
      accessed_at,
      country,
      city,
      device_type,
      os,
      browser,
      traffic_source,
      referrer_source,
      referrer_url,
      is_return_visit,
      engagement_score,
      intent_signal,
      total_duration_seconds,
      pages_viewed_count,
      max_page_reached,
      total_pages,
      completion_percentage,
      downloaded,
      utm_source,
      utm_medium,
      utm_campaign,
      file_id,
      files!inner(original_name)
    `;
  }

  // Fetch all logs
  const { data: logs } = await supabaseAdmin
    .from('access_logs')
    .select(selectFields)
    .in('file_id', fileIds)
    .gte('accessed_at', historyDate.toISOString())
    .order('accessed_at', { ascending: false });

  if (!logs || logs.length === 0) {
    return new NextResponse('No analytics data to export', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  // Basic headers for Starter
  let headers = ['File Name', 'Viewer Name', 'Viewer Email', 'Accessed At'];

  // Full headers for Pro
  if (fullExport) {
    headers = [
      'File Name',
      'Viewer Name',
      'Viewer Email',
      'Accessed At',
      'Country',
      'City',
      'Device Type',
      'OS',
      'Browser',
      'Traffic Source',
      'Referrer Source',
      'Referrer URL',
      'Return Visit',
      'Engagement Score',
      'Intent Signal',
      'Duration (seconds)',
      'Pages Viewed',
      'Max Page',
      'Total Pages',
      'Completion %',
      'Downloaded',
      'UTM Source',
      'UTM Medium',
      'UTM Campaign',
    ];
  }

  const rows = logs.map((log: any) => {
    const baseRow = [
      log.files?.original_name || 'Unknown',
      log.viewer_name || '',
      log.viewer_email || '',
      log.accessed_at || '',
    ];

    if (fullExport) {
      return [
        log.files?.original_name || 'Unknown',
        log.viewer_name || '',
        log.viewer_email || '',
        log.accessed_at || '',
        log.country || '',
        log.city || '',
        log.device_type || '',
        log.os || '',
        log.browser || '',
        log.traffic_source || '',
        log.referrer_source || '',
        log.referrer_url || '',
        log.is_return_visit ? 'Yes' : 'No',
        log.engagement_score || 0,
        log.intent_signal || '',
        log.total_duration_seconds || 0,
        log.pages_viewed_count || 0,
        log.max_page_reached || 0,
        log.total_pages || 0,
        log.completion_percentage || 0,
        log.downloaded ? 'Yes' : 'No',
        log.utm_source || '',
        log.utm_medium || '',
        log.utm_campaign || '',
      ];
    }

    return baseRow;
  });

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(escapeCSV).join(',')),
  ].join('\n');

  const filename = fileId
    ? `analytics-${fileId}-${new Date().toISOString().split('T')[0]}.csv`
    : `analytics-export-${new Date().toISOString().split('T')[0]}.csv`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
