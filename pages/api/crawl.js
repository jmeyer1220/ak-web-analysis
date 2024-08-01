import axios from "axios";
import cheerio from "cheerio";
import url from "url";

const contentPatterns = [
  { pattern: /\/(blog|article|post|news)\//, type: "Article" },
  { pattern: /\/(event|webinar|workshop|conference)\//, type: "Event" },
  { pattern: /\/(product|item|service)\//, type: "Product/Service" },
  { pattern: /\/(about|contact|faq)/, type: "Info" },
  { pattern: /\/(staff|people|team)/, type: "Staff" },
  { pattern: /\/(ministry|ministries|youth|adults|young-adults|kids|children)/, type: "Ministry" },
  { pattern: /\/(episode|podcast)\//, type: "Podcast" },
  { pattern: /\/(group|home-group|connect-group)/, type: "Group" },
  { pattern: /\/(resource|download|ebook|whitepaper)\//, type: "Resource" },
  { pattern: /\/(sermon|message)\//, type: "Sermon" },
  // Add more patterns as needed
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