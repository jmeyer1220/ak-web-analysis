import axios from "axios";
import cheerio from "cheerio";
import url from "url";

const contentPatterns = [
  { pattern: /\/(blog|article|post|news)\//, type: "Articles" },
  { pattern: /\/(event|events|webinar|workshop|conference)\//, type: "Events" },
  { pattern: /\/(product|item|service)\//, type: "Product/Services" },
  { pattern: /\/(about|contact|faq)/, type: "Infos" },
  { pattern: /\/(staff|people|team)/, type: "Staffs" },
  { pattern: /\/(ministry|ministries|youth|adults|young-adults|kids|children)/, type: "Ministry" },
  { pattern: /\/(episode|podcast)\//, type: "Podcasts" },
  { pattern: /\/(group|home-group|connect-group)/, type: "Groups" },
  { pattern: /\/(resource|download|ebook|whitepaper)\//, type: "Resources" },
  { pattern: /\/(sermon|message|messages|sermons|watch)\//, type: "Sermons" },
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
    const { data } = await axios.get(targetUrl);
    const $ = cheerio.load(data);
    const links = $("a");
    
    const contentTypes = {};
    let totalCount = 0;

    links.each((index, element) => {
      const href = $(element).attr("href");
      if (href) {
        const parsedUrl = url.parse(href);
        const path = parsedUrl.pathname;

        if (path) {
          totalCount++;
          let matched = false;
          for (const { pattern, type } of contentPatterns) {
            if (pattern.test(path)) {
              contentTypes[type] = (contentTypes[type] || 0) + 1;
              matched = true;
              break;
            }
          }
          if (!matched) {
            contentTypes["Other"] = (contentTypes["Other"] || 0) + 1;
          }
        }
      }

    });

    const contentTypeBreakdown = Object.fromEntries(
      Object.entries(contentTypes).map(([type, count]) => [
        type,
        ((count / totalCount) * 100).toFixed(2) + '%'
      ])
    );

        // Detect tracking tags
    const trackingTags = {};
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

    res.status(200).json({
      pageCount: totalCount,
      contentTypes: contentTypes,
      contentTypeBreakdown: contentTypeBreakdown
    });
  } catch (error) {
    console.error("Error crawling the site:", error.message, error.stack);
    res.status(500).json({ error: "Error crawling the site" });
  }
}