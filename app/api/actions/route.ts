import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';
import { getTierLimits } from '@/lib/tierLimits';

interface ActionItem {
  id: string;
  type: 'hot_lead' | 'high_engagement' | 'return_visitor' | 'download' | 'completion';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  contact?: {
    name: string;
    email: string;
    company?: string;
  };
  file?: {
    id: string;
    name: string;
  };
  timestamp: string;
  metrics?: {
    views?: number;
    engagement?: number;
    duration?: number;
  };
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = user.email;

    // Check tier
    const { data: userData } = await supabaseAdmin
      .from('authorized_users')
      .select('id, tier')
      .eq('email', userEmail)
      .single();

    const tier = userData?.tier || 'free';
    const tierLimits = getTierLimits(tier);

    // Only Pro users get action dashboard
    if (tier !== 'pro') {
      return NextResponse.json({
        actions: [],
        summary: {
          hotLeads: 0,
          pendingFollowups: 0,
          recentCompletions: 0,
        },
        tier,
        requiresPro: true,
      });
    }

    const userId = userData?.id;
    const actions: ActionItem[] = [];

    // Get hot leads (contacts with high engagement)
    if (userId) {
      const { data: hotLeads } = await supabaseAdmin
        .from('contacts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_hot_lead', true)
        .order('last_seen_at', { ascending: false })
        .limit(10);

      hotLeads?.forEach(lead => {
        actions.push({
          id: `hot_lead_${lead.id}`,
          type: 'hot_lead',
          priority: 'high',
          title: `Hot Lead: ${lead.name || lead.email}`,
          description: `${lead.total_views || 0} views with ${lead.avg_engagement || 0}% avg engagement`,
          contact: {
            name: lead.name || 'Unknown',
            email: lead.email,
            company: lead.company,
          },
          timestamp: lead.last_seen_at,
          metrics: {
            views: lead.total_views,
            engagement: lead.avg_engagement,
          },
        });
      });
    }

    // Get user's files
    const { data: userFiles } = await supabaseAdmin
      .from('files')
      .select('id, original_name')
      .eq('user_email', userEmail);

    const fileIds = userFiles?.map(f => f.id) || [];
    const fileMap = new Map(userFiles?.map(f => [f.id, f.original_name]) || []);

    if (fileIds.length > 0) {
      // Get recent high engagement sessions
      const { data: highEngagement } = await supabaseAdmin
        .from('access_logs')
        .select('*')
        .in('file_id', fileIds)
        .gte('engagement_score', 80)
        .order('accessed_at', { ascending: false })
        .limit(10);

      highEngagement?.forEach(log => {
        // Avoid duplicates with hot leads
        if (!actions.some(a => a.contact?.email === log.viewer_email && a.type === 'hot_lead')) {
          actions.push({
            id: `high_engagement_${log.id}`,
            type: 'high_engagement',
            priority: 'high',
            title: `High Engagement: ${log.viewer_name || log.viewer_email || 'Anonymous'}`,
            description: `${log.engagement_score}% engagement on "${fileMap.get(log.file_id) || 'Unknown file'}"`,
            contact: log.viewer_email ? {
              name: log.viewer_name || 'Unknown',
              email: log.viewer_email,
            } : undefined,
            file: {
              id: log.file_id,
              name: fileMap.get(log.file_id) || 'Unknown',
            },
            timestamp: log.accessed_at,
            metrics: {
              engagement: log.engagement_score,
              duration: log.total_duration_seconds,
            },
          });
        }
      });

      // Get return visitors
      const { data: returnVisitors } = await supabaseAdmin
        .from('access_logs')
        .select('*')
        .in('file_id', fileIds)
        .eq('is_return_visit', true)
        .order('accessed_at', { ascending: false })
        .limit(10);

      returnVisitors?.forEach(log => {
        actions.push({
          id: `return_${log.id}`,
          type: 'return_visitor',
          priority: 'medium',
          title: `Return Visit: ${log.viewer_name || log.viewer_email || 'Anonymous'}`,
          description: `Returned to view "${fileMap.get(log.file_id) || 'Unknown file'}"`,
          contact: log.viewer_email ? {
            name: log.viewer_name || 'Unknown',
            email: log.viewer_email,
          } : undefined,
          file: {
            id: log.file_id,
            name: fileMap.get(log.file_id) || 'Unknown',
          },
          timestamp: log.accessed_at,
        });
      });

      // Get recent downloads
      const { data: downloads } = await supabaseAdmin
        .from('access_logs')
        .select('*')
        .in('file_id', fileIds)
        .eq('downloaded', true)
        .order('accessed_at', { ascending: false })
        .limit(10);

      downloads?.forEach(log => {
        actions.push({
          id: `download_${log.id}`,
          type: 'download',
          priority: 'medium',
          title: `Download: ${log.viewer_name || log.viewer_email || 'Anonymous'}`,
          description: `Downloaded "${fileMap.get(log.file_id) || 'Unknown file'}"`,
          contact: log.viewer_email ? {
            name: log.viewer_name || 'Unknown',
            email: log.viewer_email,
          } : undefined,
          file: {
            id: log.file_id,
            name: fileMap.get(log.file_id) || 'Unknown',
          },
          timestamp: log.accessed_at,
        });
      });

      // Get high completion views
      const { data: completions } = await supabaseAdmin
        .from('access_logs')
        .select('*')
        .in('file_id', fileIds)
        .gte('completion_percentage', 90)
        .order('accessed_at', { ascending: false })
        .limit(10);

      completions?.forEach(log => {
        if (!actions.some(a => a.id.includes(log.id))) {
          actions.push({
            id: `completion_${log.id}`,
            type: 'completion',
            priority: 'low',
            title: `Completed: ${log.viewer_name || log.viewer_email || 'Anonymous'}`,
            description: `${log.completion_percentage}% of "${fileMap.get(log.file_id) || 'Unknown file'}"`,
            contact: log.viewer_email ? {
              name: log.viewer_name || 'Unknown',
              email: log.viewer_email,
            } : undefined,
            file: {
              id: log.file_id,
              name: fileMap.get(log.file_id) || 'Unknown',
            },
            timestamp: log.accessed_at,
            metrics: {
              engagement: log.completion_percentage,
            },
          });
        }
      });
    }

    // Sort by priority and timestamp
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    actions.sort((a, b) => {
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    // Calculate summary
    const summary = {
      hotLeads: actions.filter(a => a.type === 'hot_lead').length,
      pendingFollowups: actions.filter(a => a.priority === 'high').length,
      recentCompletions: actions.filter(a => a.type === 'completion').length,
      totalActions: actions.length,
    };

    return NextResponse.json({
      actions: actions.slice(0, 20), // Limit to 20 actions
      summary,
      tier,
      requiresPro: false,
    });
  } catch (error) {
    console.error('Actions API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
