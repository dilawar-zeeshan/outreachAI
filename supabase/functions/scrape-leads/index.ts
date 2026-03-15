import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/ig;

const DIRECTORIES = [
  'yelp.', 'tripadvisor.', 'facebook.', 'instagram.', 'twitter.', 'youtube.', 'linkedin.', 
  'yellowpages.', 'foursquare.', 'mapquest.', 'groupon.', 'reddit.', 'pinterest.', 'tiktok.', 
  'google.', 'bing.', 'yahoo.', 'whatclinic.', 'booking.dentist', 'treatmentsinternational.', 
  'top10', 'bestdentist', 'reviews', 'directory', 'bbb.org', 'mapy', 'maps.me', 
  'wikipedia', 'crunchbase', 'glassdoor', 'indeed', 'monster', 'angieslist', 'trustpilot',
  'infobel', 'cylex', 'yalwa', 'hotfrog', 'doctoralia', 'topdoctors', 'sonrisalista',
  'clinicasdentales.top', 'paginegialle', 'paginasamarillas', 'infocif', 'einforma'
];

const DUMMY_EMAILS = [
  'hi@mail.com', 'test@test.com', 'user@example.com', 'example@example.com', 'mail@example.com'
];

async function getPageDetails(url: string, depth: number = 0): Promise<{ name: string | null, emails: string[], phone: string | null }> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
      }
    });
    
    if (!response.ok) return { name: null, emails: [], phone: null };
    
    const text = await response.text();
    
    // Extract Name from Title
    let name = null;
    const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
        let fullTitle = titleMatch[1].replace(/&amp;/g, '&').trim();
        let parts = fullTitle.split(/[|\-–—]/);
        // If the first part is very short (like "Madrid"), take the next part
        if (parts[0].trim().length < 10 && parts.length > 1) {
            name = parts[1].trim();
        } else {
            name = parts[0].trim();
        }
    }

    // Extract Emails
    const matches = text.match(emailRegex);
    let emails = matches 
      ? Array.from(new Set(matches.map(e => e.toLowerCase())))
          .filter(e => !e.match(/\.(png|jpg|jpeg|gif|svg|webp|js|css|pdf)$/))
          .filter(e => !DUMMY_EMAILS.includes(e))
      : [];

    let phones: string[] = [];
    const waMatches = text.match(/wa\.me\/([0-9]+)/gi);
    if (waMatches) phones.push(...waMatches.map(m => m.split(/wa\.me\//i)[1]));
    
    const telMatches = text.match(/tel:([+0-9\-\s]+)/gi);
    if (telMatches) phones.push(...telMatches.map(m => m.replace(/tel:/i, '').replace(/[^\d+]/g, '')));
    
    const generalPhoneMatches = text.match(/(?:\+|00)\d{1,3}[\s.-]?\d{2,3}[\s.-]?\d{3}[\s.-]?\d{3}/g) || text.match(/\b[6789]\d{2}[\s.-]?\d{3}[\s.-]?\d{3}\b/g);
    if (generalPhoneMatches) phones.push(...generalPhoneMatches.map(m => m.replace(/[^\d+]/g, '')));
    
    phones = Array.from(new Set(phones)).filter(p => p.length >= 8 && p.length <= 15);
    let phone = phones.length > 0 ? phones[0] : null;

    // Deep Scraping: If no emails found or no phone found and we are at top level, look for contact page
    if ((emails.length === 0 || !phone) && depth === 0) {
        const linkRegex = /href="([^"]*(?:contact|about|reach|touch|support|legal|impressum|notice|info|contacto|quienes-somos|donde-estamos|find-us)[^"]*)"/gi;
        const linkMatches = text.matchAll(linkRegex);
        
        const subPagesSeen = new Set<string>();
        for (const linkMatch of linkMatches) {
            let subUrl = linkMatch[1];
            try {
                if (subUrl.startsWith('/')) {
                    const base = new URL(url);
                    subUrl = `${base.protocol}//${base.host}${subUrl}`;
                } else if (!subUrl.startsWith('http')) {
                    continue;
                }
                
                if (subPagesSeen.has(subUrl) || subPagesSeen.size > 3) continue;
                subPagesSeen.add(subUrl);

                console.log(`[DEBUG] Deep scraping: ${subUrl}`);
                const subDetails = await getPageDetails(subUrl, depth + 1);
                let foundNew = false;
                if (subDetails.emails.length > 0) {
                    emails = Array.from(new Set([...emails, ...subDetails.emails]));
                    foundNew = true;
                }
                if (!phone && subDetails.phone) {
                    phone = subDetails.phone;
                    foundNew = true;
                }
                if (foundNew) break;
            } catch {
                continue;
            }
        }
    }

    return { name, emails, phone };
  } catch (error: any) {
    console.log(`[DEBUG] Error fetching ${url}: ${error.message}`);
    return { name: null, emails: [], phone: null };
  }
}

async function fetchDDGResults(searchQuery: string) {
  const url = `https://duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`;
  console.log(`[DEBUG] Scraping DDG: ${url}`);

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
      }
    });

    if (!res.ok) return [];

    const html = await res.text();
    const linksRegex = /class="result__a"[^>]*href="([^"]+)"[^>]*>([^<]+)/g;
    const matches = Array.from(html.matchAll(linksRegex));
    
    return matches.map(m => {
        let rawUrl = m[1];
        let finalUrl = rawUrl;
        
        if (rawUrl.includes('uddg=')) {
            const parts = rawUrl.split('uddg=');
            if (parts.length > 1) {
                finalUrl = decodeURIComponent(parts[1].split('&')[0]);
            }
        }
        
        if (finalUrl.startsWith('//')) {
            finalUrl = 'https:' + finalUrl;
        }
        
        return {
            title: m[2].trim().replace(/&amp;/g, '&'),
            url: finalUrl
        };
    }).filter(lead => {
        try {
            const domain = new URL(lead.url).hostname.toLowerCase();
            const isDirectory = DIRECTORIES.some(dir => domain.includes(dir));
            return !isDirectory;
        } catch {
            return false;
        }
    });
  } catch {
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

    // Strategy: Multi-query to get more variety and results
    const queries = [
        `${keyword} in ${city} ${country || ''} website`,
        `best ${keyword} in ${city} ${country || ''} contact`,
        `${keyword} in ${city} ${country || ''} site:es`, // Specific to the country TLD if possible
        `${keyword} ${city} ${country || ''} "email"`,
        `${keyword} ${city} ${country || ''} "contacto"`
    ];

    const allMatches = await Promise.all(queries.map(q => fetchDDGResults(q)));
    const combinedResults = allMatches.flat();
    
    // Remove duplicates by URL
    const uniqueResults = Array.from(new Map(combinedResults.map(item => [item.url, item])).values());

    console.log(`Found ${uniqueResults.length} total unique lead websites across ${queries.length} queries.`);

    // Visit each website to get more info
    const allLeads = await Promise.all(uniqueResults.slice(0, 100).map(async (lead) => {
      const { name, emails, phone } = await getPageDetails(lead.url);
      
      return {
        name: name || lead.title,
        website: lead.url,
        phone: phone,
        address: null,
        rating: null,
        emails: emails
      };
    }));
    
    const validLeads = allLeads.filter(lead => (lead.emails && lead.emails.length > 0) || lead.phone);
    
    return new Response(JSON.stringify(validLeads), {
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
