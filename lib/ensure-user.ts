import { supabaseAdmin } from '@/lib/supabase'

export async function ensureAuthorizedUser(
  email: string,
  name?: string | null,
  provider: string = 'email'
) {
  try {
    const { data: existingUser, error: selectError } = await supabaseAdmin
      .from('authorized_users')
      .select('id, name, email, tier')
      .eq('email', email)
      .single()

    if (selectError && selectError.code !== 'PGRST116') {
      console.error('Error checking user:', selectError)
      return null
    }

    if (!existingUser) {
      const { data: newUser, error: insertError } = await supabaseAdmin
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
        console.error('Error creating user:', insertError)
        return null
      }

      return newUser
    }

    return existingUser
  } catch (error) {
    console.error('ensureAuthorizedUser error:', error)
    return null
  }
}
