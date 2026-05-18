const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');

const app = express();
app.use(cors());
app.use(express.json());

const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/ig;
const DUMMY_EMAILS = [
  'hi@mail.com', 'test@test.com', 'user@example.com', 'example@example.com', 'mail@example.com',
  'sentry.io', 'domain.com'
];
const DIRECTORIES = [
  'yelp.', 'tripadvisor.', 'facebook.', 'instagram.', 'twitter.', 'youtube.', 'linkedin.', 
  'yellowpages.', 'foursquare.', 'mapquest.', 'groupon.', 'reddit.', 'pinterest.', 'tiktok.', 
  'google.', 'bing.', 'yahoo.', 'whatclinic.', 'booking.dentist', 'treatmentsinternational.', 
  'top10', 'bestdentist', 'reviews', 'directory', 'bbb.org', 'mapy', 'maps.me', 
  'wikipedia', 'crunchbase', 'glassdoor', 'indeed', 'monster', 'angieslist', 'trustpilot',
  'infobel', 'cylex', 'yalwa', 'hotfrog', 'doctoralia', 'topdoctors', 'sonrisalista',
  'clinicasdentales.top', 'paginegialle', 'paginasamarillas', 'infocif', 'einforma'
];

function getDistrictQueries(keyword, city) {
  const c = city.toLowerCase().trim();
  const districts = [];
  
  if (c === 'madrid') {
    districts.push('Centro', 'Salamanca', 'Chamberi', 'Retiro', 'Arganzuela', 'Chamartin', 'Tetuan', 'Carabanchel', 'Moncloa', 'Latina', 'Vallecas', 'Ciudad Lineal');
  } else if (c === 'barcelona') {
    districts.push('Eixample', 'Ciutat Vella', 'Gracia', 'Sants-Montjuic', 'Sarria-Sant Gervasi', 'Les Corts', 'Horta-Guinardo', 'Nou Barris', 'Sant Andreu', 'Sant Marti');
  } else {
    // Generic sub-regions for any other city (cardinal directions and zones)
    districts.push('Centro', 'Norte', 'Sur', 'Este', 'Oeste', 'Nordeste', 'Noroeste', 'Sureste', 'Suroeste');
  }
  
  // Return "keyword in district, city"
  return districts.map(district => `${keyword} in ${district}, ${city}`);
}

async function scrapeWebsiteEmails(browser, url) {
  let emails = [];
  let page = null;
  try {
    page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
    
    // Set viewport and timeouts
    await page.setViewport({ width: 1280, height: 800 });
    await page.setDefaultNavigationTimeout(10000);
    
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
    
    const extractFromText = (text) => {
      const matches = text.match(emailRegex);
      return matches 
        ? Array.from(new Set(matches.map(e => e.toLowerCase())))
            .filter(e => !e.match(/\.(png|jpg|jpeg|gif|svg|webp|js|css|pdf)$/))
            .filter(e => !DUMMY_EMAILS.some(dummy => e.includes(dummy)))
        : [];
    };

    const text = await page.content();
    emails = extractFromText(text);

    // Deep Crawl: Try to find contact page if no emails found
    if (emails.length === 0) {
      const contactUrl = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a'));
        const contactLink = links.find(a => {
          const href = (a.href || '').toLowerCase();
          const text = (a.textContent || '').toLowerCase();
          return href.includes('contact') || href.includes('contacto') || 
                 text.includes('contact') || text.includes('contacto') ||
                 href.includes('about') || text.includes('about') ||
                 href.includes('reach') || href.includes('touch') ||
                 href.includes('quienes-somos') || href.includes('donde-estamos') ||
                 href.includes('legal') || href.includes('notice') || href.includes('impressum');
        });
        return contactLink ? contactLink.href : null;
      });

      if (contactUrl && contactUrl.startsWith('http')) {
        await page.goto(contactUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
        const contactText = await page.content();
        const contactEmails = extractFromText(contactText);
        emails = Array.from(new Set([...emails, ...contactEmails]));
      }
    }
  } catch (err) {
    // Silent fail
  } finally {
    if (page) {
      try {
        await page.close();
      } catch (e) {}
    }
  }
  return emails;
}

app.post('/scrape', async (req, res) => {
  const { keyword, city, country } = req.body;
  if (!keyword || !city) {
    return res.status(400).json({ error: 'Keyword and City are required' });
  }

  const queries = getDistrictQueries(keyword, city);

  console.log(`\n==========================================`);
  console.log(`[LOCAL SCRAPER] HIGH-VOLUME DISTRICT SCRAPE`);
  console.log(`[LOCAL SCRAPER] Keyword: "${keyword}"`);
  console.log(`[LOCAL SCRAPER] City: "${city}"`);
  console.log(`[LOCAL SCRAPER] Country: "${country || 'Spain'}"`);
  console.log(`[LOCAL SCRAPER] District Queries Count: ${queries.length}`);
  console.log(`==========================================\n`);

  let browser = null;
  try {
    browser = await puppeteer.launch({
      headless: true,
      defaultViewport: { width: 1200, height: 800 },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    });

    const allScrapedLeads = [];
    const searchBatchSize = 3;
    
    // Execute Maps searches in parallel batches of 3 tabs to optimize RAM/CPU
    for (let i = 0; i < queries.length; i += searchBatchSize) {
      const batch = queries.slice(i, i + searchBatchSize);
      console.log(`[LOCAL SCRAPER] Launching Maps search batch [${i + 1} - ${Math.min(i + searchBatchSize, queries.length)} / ${queries.length}]`);
      
      const batchPromises = batch.map(async (searchQuery, idx) => {
        let tab = null;
        try {
          tab = await browser.newPage();
          await tab.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
          await tab.setViewport({ width: 1200, height: 800 });
          
          const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;
          console.log(`[LOCAL SCRAPER] [Tab ${idx+1}] Navigating to: "${searchQuery}"`);
          await tab.goto(mapsUrl, { waitUntil: 'networkidle2', timeout: 35000 });
          
          // Scroll the sidebar to load all listings in this district
          await tab.evaluate(async () => {
            const getScrollContainer = () => {
              const feed = document.querySelector('div[role="feed"]');
              if (feed) return feed;
              return Array.from(document.querySelectorAll('div')).find(el => {
                const style = window.getComputedStyle(el);
                return (style.overflowY === 'auto' || style.overflowY === 'scroll') && el.scrollHeight > el.clientHeight;
              });
            };
            
            const container = getScrollContainer();
            if (!container) return;
            
            await new Promise((resolve) => {
              let lastHeight = container.scrollHeight;
              let sameHeightCount = 0;
              
              const timer = setInterval(() => {
                container.scrollBy(0, 1000);
                
                setTimeout(() => {
                  const currentHeight = container.scrollHeight;
                  if (currentHeight === lastHeight) {
                    sameHeightCount++;
                    if (sameHeightCount >= 10) { // Done scrolling
                      clearInterval(timer);
                      resolve();
                    }
                  } else {
                    lastHeight = currentHeight;
                    sameHeightCount = 0;
                  }
                }, 150);
              }, 300);
            });
          });
          
          // Rapid zero-delay card extraction
          const tabLeads = await tab.evaluate(() => {
            const cards = Array.from(document.querySelectorAll('.Nv2PK'));
            return cards.map(card => {
              const nameEl = card.querySelector('.qBF1Pd');
              const name = nameEl ? nameEl.textContent.trim() : null;
              
              let website = null;
              const webEl = card.querySelector('a[aria-label*="Website"]') || 
                            card.querySelector('a[data-value="Website"]') ||
                            Array.from(card.querySelectorAll('a')).find(a => {
                              const href = a.href || '';
                              const label = a.getAttribute('aria-label') || '';
                              return href.startsWith('http') && !href.includes('google.com') && !href.includes('google.es') &&
                                     (label.toLowerCase().includes('website') || a.textContent.toLowerCase().includes('website'));
                            });
              if (webEl) website = webEl.href;
              
              let phone = null;
              let address = null;
              
              const rows = Array.from(card.querySelectorAll('.W4Efsd'));
              if (rows.length > 0) {
                const fullText = rows.map(r => r.textContent).join(' | ');
                const phoneRegex = /(\+?[0-9]{2,3}[ -]?[0-9]{3}[ -]?[0-9]{2,4}[ -]?[0-9]{2,4}|\+?[0-9]{9,12})/g;
                const matches = fullText.match(phoneRegex);
                if (matches) {
                  const validPhone = matches.find(m => {
                    const digits = m.replace(/[^0-9]/g, '');
                    return digits.length >= 9 && digits.length <= 15;
                  });
                  if (validPhone) phone = validPhone.trim();
                }
                
                const addressRow = rows.find(r => {
                  const text = r.textContent;
                  return text.length > 10 && !text.includes('★') && !text.match(/(open|closed|abierto|cerrado)/i);
                });
                if (addressRow) address = addressRow.textContent.trim();
              }
              
              let rating = null;
              const ratingEl = card.querySelector('span[aria-label*="stars"]');
              if (ratingEl) {
                const aria = ratingEl.getAttribute('aria-label') || '';
                const match = aria.match(/([0-9.]+)\s*stars/i);
                rating = match ? parseFloat(match[1]) : parseFloat(ratingEl.textContent.trim()) || null;
              }
              
              return { name, website, phone, address, rating };
            }).filter(l => l.name);
          });
          
          console.log(`[LOCAL SCRAPER] [Tab ${idx+1}] Scraped ${tabLeads.length} listings.`);
          allScrapedLeads.push(...tabLeads);
        } catch (err) {
          console.error(`[LOCAL SCRAPER] [Tab ${idx+1}] Scraper error:`, err.message);
        } finally {
          if (tab) {
            try {
              await tab.close();
            } catch (e) {}
          }
        }
      });
      
      await Promise.all(batchPromises);
    }

    console.log(`[LOCAL SCRAPER] Scraped ${allScrapedLeads.length} total raw district listings. De-duplicating...`);
    
    // De-duplicate based on clean normalized name or website hostname
    const uniqueLeadsMap = new Map();
    for (const lead of allScrapedLeads) {
      const cleanName = lead.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      let websiteKey = null;
      try {
        if (lead.website) websiteKey = new URL(lead.website).hostname.toLowerCase();
      } catch (e) {}
      
      const key = websiteKey || cleanName;
      if (!uniqueLeadsMap.has(key)) {
        uniqueLeadsMap.set(key, lead);
      } else {
        // Merge missing details
        const existing = uniqueLeadsMap.get(key);
        if (!existing.phone && lead.phone) existing.phone = lead.phone;
        if (!existing.website && lead.website) existing.website = lead.website;
        if (!existing.address && lead.address) existing.address = lead.address;
        if (!existing.rating && lead.rating) existing.rating = lead.rating;
      }
    }
    
    const uniqueLeads = Array.from(uniqueLeadsMap.values());
    console.log(`[LOCAL SCRAPER] De-duplicated into ${uniqueLeads.length} unique local businesses.`);

    // Crawl websites for emails concurrently in parallel batches of 10
    const emailBatchSize = 10;
    console.log(`[LOCAL SCRAPER] Crawling websites for emails in parallel batches of ${emailBatchSize}...`);
    
    for (let i = 0; i < uniqueLeads.length; i += emailBatchSize) {
      const batch = uniqueLeads.slice(i, i + emailBatchSize);
      console.log(`[LOCAL SCRAPER] Crawling email batch [${i + 1} - ${Math.min(i + emailBatchSize, uniqueLeads.length)} / ${uniqueLeads.length}]`);
      
      const batchPromises = batch.map(async (lead) => {
        if (lead.website) {
          try {
            const domain = new URL(lead.website).hostname.toLowerCase();
            const isDirectory = DIRECTORIES.some(dir => domain.includes(dir));
            if (!isDirectory) {
              const emails = await scrapeWebsiteEmails(browser, lead.website);
              lead.emails = emails;
            } else {
              lead.website = null; // Filter out directory domains
            }
          } catch (err) {
            // Handled
          }
        }
      });
      
      await Promise.all(batchPromises);
    }

    console.log(`\n[LOCAL SCRAPER] HIGH-VOLUME SCRAPING COMPLETE! Discovered ${uniqueLeads.length} unique leads total.`);
    res.json(uniqueLeads);
  } catch (error) {
    console.error('[LOCAL SCRAPER] Fatal scraper error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (e) {}
    }
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`\n===============================================================`);
  console.log(`[LOCAL SCRAPER] Local Google Maps Scraper server started!`);
  console.log(`[LOCAL SCRAPER] Listening on: http://localhost:${PORT}`);
  console.log(`[LOCAL SCRAPER] React frontend will auto-detect this scraper!`);
  console.log(`===============================================================\n`);
});
