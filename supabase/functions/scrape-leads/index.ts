import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/ig;

interface BusinessResult {
  title: string;
  website?: string;
  phoneNumber?: string;
  address?: string;
  rating?: number;
}

async function getEmails(url: string) {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
      }
    });
    
    if (!response.ok) return [];
    
    const text = await response.text();
    const matches = text.match(emailRegex);
    if (!matches) return [];

    return matches
      .map(e => e.toLowerCase())
      .filter(e => !e.match(/\.(png|jpg|jpeg|gif|svg|webp|js|css|pdf)$/))
      .filter((e, i, self) => self.indexOf(e) === i);
  } catch (_e) {
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { keyword, city, country } = await req.json()
    
    if (!keyword || !city) {
      return new Response(JSON.stringify({ error: 'Keyword and city are required.' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    const serperApiKey = Deno.env.get('SERPER_API_KEY');
    if (!serperApiKey) {
      console.error("SERPER_API_KEY is not set.");
      throw new Error('SERPER_API_KEY is not set in secrets.');
    }

    const searchQuery = `${keyword} in ${city}, ${country || ''}`;
    console.log(`[DEBUG] Searching for: ${searchQuery}`);

    const serperRes = await fetch("https://google.serper.dev/maps", {
      method: "POST",
      headers: {
        "X-API-KEY": serperApiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        q: searchQuery,
      }),
    });

    console.log(`Serper Status: ${serperRes.status}`);
    const serperData = await serperRes.json();
    
    if (!serperRes.ok) {
      console.error("Serper Error Response:", serperData);
      throw new Error(`Serper API error: ${serperData.message || serperRes.statusText}`);
    }

    // Serper returns results in 'places' for maps endpoint
    const mapsResults: BusinessResult[] = serperData.places || serperData.maps || [];
    
    console.log(`Found ${mapsResults.length} businesses.`);

    // Process extraction
    const allLeads = await Promise.all(mapsResults.map(async (biz) => {
      let emails: string[] = [];
      if (biz.website) {
        emails = await getEmails(biz.website);
      }
      
      return {
        name: biz.title,
        website: biz.website || null,
        phone: biz.phoneNumber || null,
        address: biz.address || null,
        rating: biz.rating || null,
        emails: emails
      };
    }));
    
    return new Response(JSON.stringify(allLeads), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error("Scrape Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
})
