import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';
import { getTierLimits } from '@/lib/tierLimits';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ tier: 'free', limits: getTierLimits('free') });
    }

    const { data: userData } = await supabaseAdmin
      .from('authorized_users')
      .select('tier')
      .eq('email', user.email)
      .single();

    const tier = userData?.tier || 'free';

    return NextResponse.json({
      tier,
      limits: getTierLimits(tier),
    });
  } catch (error) {
    console.error('Failed to get user tier:', error);
    return NextResponse.json({ tier: 'free', limits: getTierLimits('free') });
  }
}
