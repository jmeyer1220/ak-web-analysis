import axios from "axios";
import cheerio from "cheerio";
import url from "url";
import parseString from "xml2js";

async function crawlPage(targetUrl, contentTypes) {
  const { data } = await axios.get(targetUrl);
  const $ = cheerio.load(data);
  const links = $("a");

  links.each((index, element) => {
    const href = $(element).attr("href");
    if (href) {
      const parsedUrl = url.parse(href);
      const path = parsedUrl.pathname;
      if (path) {
        if (path.includes("/events/")) {
          contentTypes.events++;
        } else if (path.includes("/sermons/")) {
          contentTypes.sermons++;
        } else if (path.includes("/news/")) {
          contentTypes.news++;
        } else if (path.includes("/blog/")) {
          contentTypes.blog++;
        } else if (path.endsWith(".html") || path.endsWith("/") || path === "") {
          contentTypes.pages++;
        } else {
          contentTypes.other++;
        }
      }
    }
  });

  return contentTypes;
}

async function crawlSitemap(sitemapUrl, contentTypes) {
  const { data } = await axios.get(sitemapUrl);
  return new Promise((resolve, reject) => {
    parseString(data, async (err, result) => {
      if (err) {
        reject(err);
      } else {
        const urls = result.sitemapindex ? 
          result.sitemapindex.sitemap.map(sitemap => sitemap.loc[0]) :
          result.urlset.url.map(url => url.loc[0]);

        for (const url of urls) {
          if (url.endsWith('.xml')) {
            await crawlSitemap(url, contentTypes);
          } else {
            contentTypes.pages++;
          }
        }
        resolve(contentTypes);
      }
    });
  });
}

const contentPatterns = [
  { pattern: /\/(blog|article|post|news|blogs|articles|posts)\//, type: "Articles" },
  { pattern: /\/(event|events|webinar|workshop|conference)\//, type: "Events" },
  { pattern: /\/(product|item|service|services|products|items|merchandise|apparel)\//, type: "Product/Service Pages" },
  { pattern: /\/(about|contact|faq)/, type: "Info Pages" },
  { pattern: /\/(staff|people|team)/, type: "Staff" },
  { pattern: /\/(ministry|ministries|youth|adults|young-adults|kids|children|students)/, type: "Ministry Pages" },
  { pattern: /\/(episode|podcast|podcasts|episodes)\//, type: "Podcasts" },
  { pattern: /\/(group|home-group|connect-group)/, type: "Groups" },
  { pattern: /\/(resource|download|ebook|whitepaper)\//, type: "Resources" },
  { pattern: /\/(sermon|message|messages|sermons|watch)\//, type: "Sermons" },
  { pattern: /\/(locations|location|campus|campuses)\//, type: "Locations" },
  // Add more patterns as needed
];

const trackingPatterns = [
  { 
    name: "Google Analytics", 
    pattern: /UA-\d{4,10}-\d{1,4}/g,
    scriptPattern: /google-analytics\.com\/analytics\.js|googletagmanager\.com\/gtag\/js/
  },
  { 
    name: "Google Analytics 4", 
    pattern: /G-[A-Z0-9]{10}/g,
    scriptPattern: /googletagmanager\.com\/gtag\/js/
  },
  { 
    name: "Facebook Pixel", 
    pattern: /fbq\('init',\s*'(\d+)'\)/,
    scriptPattern: /connect\.facebook\.net\/en_US\/fbevents\.js/
  },
  { 
    name: "HubSpot", 
    pattern: /https:\/\/js\.hs-scripts\.com\/(\d+)\.js/,
    scriptPattern: /js\.hs-scripts\.com/
  },
  { 
    name: "Pinterest Tag", 
    pattern: /pintrk\('load',\s*'(\d+)'\)/,
    scriptPattern: /s\.pinimg\.com\/ct\/core\.js/
  },
  { 
    name: "TikTok Pixel", 
    pattern: /ttq\.load\('([A-Z0-9]+)'\)/,
    scriptPattern: /analytics\.tiktok\.com\/i18n\/pixel\/events\.js/
  }
];
export default async function handler(req, res) {
  const { url: targetUrl } = req.query;

  try {
    let contentTypes = {
      pages: 0,
      events: 0,
      sermons: 0,
      news: 0,
      blog: 0,
      resources: 0,
      staff: 0,
      locations: 0,
      services: 0,
      other: 0
    };

    let crawledUrls = new Set();

    if (targetUrl.endsWith('.xml')) {
      contentTypes = await crawlSitemap(targetUrl, contentTypes);
    } else {
      contentTypes = await crawlPage(targetUrl, contentTypes);
    }

    const totalCount = Object.values(contentTypes).reduce((a, b) => a + b, 0);
    console.log(`Content types analyzed. Total links: ${totalCount}`);

    const contentTypeBreakdown = {};
    for (const [type, count] of Object.entries(contentTypes)) {
      contentTypeBreakdown[type] = ((count / totalCount) * 100).toFixed(2) + '%';
    }

    console.log(`Detecting tracking tags...`);
    const trackingTags = {};
    const { data } = await axios.get(targetUrl);
    const $ = cheerio.load(data);
    const scripts = $("script");

    scripts.each((index, element) => {
      const scriptContent = $(element).html() || "";
      const scriptSrc = $(element).attr("src") || "";

      trackingPatterns.forEach(({ name, pattern, scriptPattern }) => {
        if (scriptPattern.test(scriptSrc) || pattern.test(scriptContent)) {
          const match = scriptContent.match(pattern) || scriptSrc.match(pattern);
          if (match) {
            trackingTags[name] = match[1] || "Detected";
          }
        }
      });
    });

    console.log(`Tracking tags detected: ${Object.keys(trackingTags).length}`);

    res.status(200).json({
      pageCount: totalCount,
      contentTypes: contentTypes,
      contentTypeBreakdown: contentTypeBreakdown,
      trackingTags: trackingTags,
      crawledUrls: Array.from(crawledUrls) // Convert Set to Array for JSON serialization
    });
  } catch (error) {
    console.error("Error crawling the site:", error.message, error.stack);
    res.status(500).json({ error: "Error crawling the site", details: error.message });
  }
}