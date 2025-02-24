import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from '@supabase/supabase-js';

// CORS headers to allow all origins
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY') || 'sk-aa6acb0f4b134fc49e90d80d64f0f950';
const API_URL = 'https://api.deepseek.com/v1/chat/completions';

const systemPrompt = `Create a mind map structure for studying. Format the response as JSON with the following structure:
{
  "nodes": [
    { "id": "string", "label": "string" }
  ],
  "edges": [
    { "id": "string", "source": "string", "target": "string" }
  ]
}
Follow these guidelines:
1. Keep node labels concise and clear
2. Create a hierarchical structure
3. Use meaningful relationships
4. Include 5-10 key concepts
5. Ensure all node IDs are unique
6. Ensure all edges connect existing nodes`;

async function generateMindMap(topic: string) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: `Create a mind map for studying ${topic}. Include main concepts and their relationships.`,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      const mindMapData = JSON.parse(content);
      return {
        success: true,
        data: mindMapData,
      };
    } catch (e) {
      console.error('Failed to parse API response:', e);
      throw new Error('Invalid response format from API');
    }
  } catch (error) {
    console.error('Error generating mind map:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    };
  }
}

serve(async (req: Request) => {
  // Enhanced CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '3600'
  };

  // Immediately handle OPTIONS requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const url = new URL(req.url);
    
    // Log request details
    console.log('REQUEST:', {
      method: req.method,
      url: url.toString(),
      pathname: url.pathname,
      headers: {
        'content-type': req.headers.get('content-type'),
        'authorization': req.headers.get('authorization') ? 'present' : 'missing',
        'apikey': req.headers.get('apikey') ? 'present' : 'missing'
      }
    });

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders
      });
    }

    // Handle POST request for mind map generation
    if (req.method === 'POST') {
      const authHeader = req.headers.get('authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Missing authorization header' }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Extract the JWT token
      const token = authHeader.replace('Bearer ', '');
      if (!token) {
        return new Response(
          JSON.stringify({ error: 'Invalid authorization header format' }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Initialize the Supabase client with the token
// Initialize Supabase client with verified environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase configuration - check environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
});

      try {
        // Validate the user
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
          return new Response(
            JSON.stringify({ error: 'Unauthorized' }),
            {
              status: 401,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
      } catch (error) {
        return new Response(
          JSON.stringify({ error: 'Authentication failed' }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { topic } = await req.json();

      if (!topic) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Topic is required',
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }

      const result = await generateMindMap(topic);

      return new Response(
        JSON.stringify(result),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: result.success ? 200 : 500,
        }
      );
    }

    // Handle GET requests
    if (req.method === 'GET') {
      if (url.pathname === '/ping') {
        return new Response(
          JSON.stringify({ status: 'Edge Function is running' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      if (url.pathname === '/test') {
      // Debug environment variables
      console.log('Environment Variables:', Deno.env.toObject());
      
      return new Response(
        JSON.stringify({
          status: 'Configuration Test',
          config: {
            supabase_url: Deno.env.get('SUPABASE_URL') ? 'set' : 'missing',
            anon_key: Deno.env.get('SUPABASE_ANON_KEY') ? 'set' : 'missing',
            deepseek_key: DEEPSEEK_API_KEY ? 'set' : 'missing'
          },
          environment: Deno.env.toObject(),
          rawConfig: {
            SUPABASE_URL: Deno.env.get('SUPABASE_URL'),
            SUPABASE_ANON_KEY: Deno.env.get('SUPABASE_ANON_KEY')
          }
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Method not allowed',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405,
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
