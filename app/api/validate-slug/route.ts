import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Validate if a slug is available
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { slug } = body;

        if (!slug) {
            return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
        }

        // Validate slug format
        if (!/^[a-z0-9-]+$/.test(slug)) {
            return NextResponse.json({
                available: false,
                error: 'Invalid format. Use lowercase letters, numbers, and hyphens only.'
            }, { status: 200 });
        }

        // Check if slug is already taken - use count instead of single
        const { data: existingFiles, error: queryError } = await supabaseAdmin
            .from('files')
            .select('id', { count: 'exact', head: false })
            .eq('slug', slug);

        if (queryError) {
            console.error('Query error:', queryError);
            return NextResponse.json({ error: 'Validation failed' }, { status: 500 });
        }

        // If any files found with this slug, it's taken
        if (existingFiles && existingFiles.length > 0) {
            // Generate a suggestion by adding a random number
            const randomNum = Math.floor(Math.random() * 999) + 1;
            const suggestion = `${slug}-${randomNum}`;

            return NextResponse.json({
                available: false,
                suggestion,
                message: 'This link name is already taken.'
            }, { status: 200 });
        }

        return NextResponse.json({
            available: true,
            message: 'This link name is available!'
        }, { status: 200 });

    } catch (error) {
        console.error('Validate slug error:', error);
        return NextResponse.json({ error: 'Validation failed' }, { status: 500 });
    }
}
