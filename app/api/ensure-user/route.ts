import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST() {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
              })
            } catch (error) {
              console.error('Cookie set error:', error)
            }
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user exists in authorized_users
    const { data: existingUser, error: selectError } = await supabaseAdmin
      .from('authorized_users')
      .select('id, name, email, tier')
      .eq('email', user.email)
      .single()

    if (selectError && selectError.code !== 'PGRST116') {
      console.error('Error checking user:', selectError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!existingUser) {
      // Create the user
      const userName = user.user_metadata?.name ||
                       user.user_metadata?.full_name ||
                       user.user_metadata?.display_name ||
                       user.email?.split('@')[0] ||
                       'User'

      const provider = user.app_metadata?.provider || 'email'

      const { data: newUser, error: insertError } = await supabaseAdmin
        .from('authorized_users')
        .insert({
          email: user.email,
          name: userName,
          auth_provider: provider,
          email_verified: true,
          tier: 'free',
          subscription_status: 'free',
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error creating user:', insertError)
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
      }

      console.log('Created authorized_users record via API:', newUser)
      return NextResponse.json({ user: newUser, created: true })
    }

    return NextResponse.json({ user: existingUser, created: false })
  } catch (error) {
    console.error('ensure-user API error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
