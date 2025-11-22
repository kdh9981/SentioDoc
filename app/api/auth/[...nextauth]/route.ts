import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { supabaseAdmin } from "@/lib/supabase";

const handler = NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
    ],
    callbacks: {
        async signIn({ user }) {
            if (!user.email) {
                return false;
            }

            try {
                // Check if user email exists in authorized_users table
                const { data, error } = await supabaseAdmin
                    .from('authorized_users')
                    .select('email, is_active')
                    .eq('email', user.email)
                    .eq('is_active', true)
                    .single();

                if (error || !data) {
                    console.log('Unauthorized login attempt:', user.email);
                    return false;
                }

                return true;
            } catch (error) {
                console.error('Auth check error:', error);
                return false;
            }
        },
    },
    pages: {
        error: '/auth/error',
    },
});

export { handler as GET, handler as POST };
