import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
    try {
        const { data: files, error } = await supabaseAdmin
            .from('files')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({
            files: files?.map(f => ({
                ...f,
                createdAt: f.created_at, // Map snake_case to camelCase
                deletedAt: f.deleted_at
            }))
        });
    } catch (error) {
        console.error('Fetch files error:', error);
        return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 });
    }
}

