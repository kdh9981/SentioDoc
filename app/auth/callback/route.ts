import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

async function ensureAuthorizedUser(email: string, name: string, provider: string) {
  try {
    console.log('ensureAuthorizedUser called:', { email, name, provider })

    const { data: existingUser, error: selectError } = await supabaseAdmin
      .from('authorized_users')
      .select('id, name')
      .eq('email', email)
      .single()

    if (selectError && selectError.code !== 'PGRST116') {
      console.error('Error checking existing user:', selectError)
    }

    if (!existingUser) {
      console.log('Creating new authorized_users record for:', email)

      const { data: insertData, error: insertError } = await supabaseAdmin
        .from('authorized_users')
        .insert({
          email: email,
          name: name || email.split('@')[0],
          auth_provider: provider,
          email_verified: true,
          tier: 'free',
          subscription_status: 'free',
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error creating authorized_users record:', insertError)
        return null
      }

      console.log('Successfully created authorized_users record:', insertData)
      return { ...insertData, isNew: true }
    } else {
      if (!existingUser.name || existingUser.name === 'User') {
        console.log('Updating name for existing user:', email)
        await supabaseAdmin
          .from('authorized_users')
          .update({ name: name || email.split('@')[0], email_verified: true })
          .eq('email', email)
      }
      console.log('User already exists in authorized_users:', existingUser)
      return { ...existingUser, isNew: false }
    }
  } catch (error) {
    console.error('ensureAuthorizedUser error:', error)
    return null
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/dashboard'
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')

  console.log('=== CALLBACK ROUTE START ===')
  console.log('Params:', { code: !!code, token_hash: !!token_hash, type, error })

  if (error) {
    console.error('Auth error from URL:', error, error_description)

    if (error === 'access_denied' && error_description?.includes('expired')) {
      return NextResponse.redirect(`${origin}/auth/resend-verification?error=link_expired`)
    }

    return NextResponse.redirect(`${origin}/auth/signin?error=${encodeURIComponent(error)}`)
  }

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

  // Handle email verification (token_hash flow)
  if (token_hash && type) {
    console.log('Processing email verification with token_hash')

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'signup' | 'recovery' | 'email',
    })

    console.log('verifyOtp result:', {
      hasUser: !!data?.user,
      hasSession: !!data?.session,
      error: verifyError?.message
    })

    if (verifyError) {
      console.error('Verification error:', verifyError.message, verifyError.code)

      if (verifyError.message.includes('expired') || verifyError.code === 'otp_expired') {
        return NextResponse.redirect(`${origin}/auth/resend-verification?error=link_expired`)
      }

      if (verifyError.message.includes('invalid') || verifyError.code === 'otp_invalid') {
        return NextResponse.redirect(`${origin}/auth/signin?error=invalid_link`)
      }

      return NextResponse.redirect(`${origin}/auth/signin?error=verification_failed`)
    }

    // Verification successful - create authorized_users record
    if (data?.user) {
      console.log('Verification successful for:', data.user.email)
      console.log('User metadata:', JSON.stringify(data.user.user_metadata))

      const userName = data.user.user_metadata?.name ||
                       data.user.user_metadata?.full_name ||
                       data.user.user_metadata?.display_name ||
                       data.user.email?.split('@')[0] ||
                       'User'

      // Create authorized_users record
      const authorizedUser = await ensureAuthorizedUser(data.user.email!, userName, 'email')
      console.log('ensureAuthorizedUser result:', authorizedUser)

      // Send welcome email
      if (type === 'signup' || type === 'email') {
        try {
          if (process.env.N8N_WELCOME_WEBHOOK_URL) {
            await fetch(process.env.N8N_WELCOME_WEBHOOK_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: data.user.email,
                name: userName,
              }),
            })
          }
        } catch (e) {
          console.error('Welcome email error:', e)
        }
      }

      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/auth/reset-password`)
      }

      // Check if we have a session (same browser)
      if (data.session) {
        console.log('Session exists - redirecting to dashboard')
        return NextResponse.redirect(`${origin}/dashboard`)
      }

      // No session (different browser) - show success message
      console.log('No session - redirecting to signin with verified=true')
      return NextResponse.redirect(`${origin}/auth/signin?verified=true`)
    }

    // No user in response but no error - still treat as success
    console.log('No user in response, redirecting to signin with verified=true')
    return NextResponse.redirect(`${origin}/auth/signin?verified=true`)
  }

  // Handle OAuth/PKCE code exchange (Google, Kakao, or email verification with PKCE)
  if (code) {
    console.log('Processing code exchange')

    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('Code exchange error:', exchangeError.message, exchangeError.code)

      // PKCE code exchange fails in different browser because verifier is missing
      // This often happens when user clicks email verification link in different browser
      // The email might still be verified - redirect to signin with helpful message
      if (exchangeError.message.includes('code verifier') ||
          exchangeError.message.includes('invalid') ||
          exchangeError.code === 'bad_code_verifier') {
        console.log('Code exchange failed - likely different browser, redirecting to signin')
        return NextResponse.redirect(`${origin}/auth/signin?verified=true`)
      }

      return NextResponse.redirect(`${origin}/auth/signin?error=auth_failed`)
    }

    if (data?.user) {
      const provider = data.user.app_metadata?.provider || 'oauth'

      console.log('OAuth successful for:', data.user.email, 'Provider:', provider)

      const userName = data.user.user_metadata?.full_name ||
                       data.user.user_metadata?.name ||
                       data.user.user_metadata?.display_name ||
                       data.user.email?.split('@')[0] ||
                       'User'

      // Create authorized_users record (returns null if error, or user with isNew flag)
      const authorizedUser = await ensureAuthorizedUser(data.user.email!, userName, provider)

      // Send welcome email for NEW OAuth users only
      if (authorizedUser?.isNew && process.env.N8N_WELCOME_WEBHOOK_URL) {
        try {
          console.log('Sending welcome email to new OAuth user:', data.user.email)
          await fetch(process.env.N8N_WELCOME_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: data.user.email,
              name: userName,
            }),
          })
        } catch (e) {
          console.error('Welcome email error:', e)
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Fallback
  console.log('Fallback - no code or token_hash, redirecting to dashboard')
  return NextResponse.redirect(`${origin}/dashboard`)
}
