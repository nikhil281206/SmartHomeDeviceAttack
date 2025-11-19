/// <reference types="https://deno.land/x/deno@v1.40.4/lib.deno.d.ts" />
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey'
};

Deno.serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        // --- 1. Get Environment Variables ---
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        // CRITICAL FIX: Using the correct, renamed secret: SERVICE_ROLE_KEY
        const supabaseKey = Deno.env.get('SERVICE_ROLE_KEY'); 

        // Fail early if environment is missing
        if (!supabaseUrl || !supabaseKey) {
            console.error("SUPABASE_URL or SERVICE_ROLE_KEY environment variables are missing.");
            throw new Error("Internal configuration error: Service keys not loaded.");
        }

        // --- 2. Initialize Supabase Client (Using Service Role Key) ---
        const supabase = createClient(supabaseUrl, supabaseKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });
        
        // --- 3. Parse Request Body ---
        // We expect: { "device_id": "UUID" }
        const { device_id } = await req.json();

        if (!device_id) {
            return new Response(JSON.stringify({ error: 'Missing device_id in request body.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // --- 4. Reset device status to 'normal' ---
        // This is the operation that requires Service Role Key permission
        const { error: updateError } = await supabase.from('devices').update({
            status: 'online',
            last_event_at: new Date().toISOString()
        }).eq('id', device_id);

        if (updateError) {
            // Log the specific database error for diagnosis
            console.error("Database UPDATE failed:", updateError.message);
            throw new Error(`Database error resetting status: ${updateError.message}`);
        }
        
        // --- 5. Success Response ---
        return new Response(JSON.stringify({ success: true, message: `Status for device ${device_id} reset to 'normal'.` }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        // Global Error Handler
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error("Resolve function execution error:", errorMessage); 
        
        return new Response(JSON.stringify({ 
            error: errorMessage,
            hint: "Check function logs for specific database error details."
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});