import axios from "axios";
import cheerio from "cheerio";
import url from "url";
import { parseString } from "xml2js";

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

export default async function handler(req, res) {
  const { url: targetUrl } = req.query;

  try {
    let contentTypes = {
      pages: 0,
      events: 0,
      sermons: 0,
      news: 0,
      blog: 0,
      other: 0
    };

    if (targetUrl.endsWith('.xml')) {
      contentTypes = await crawlSitemap(targetUrl, contentTypes);
    } else {
      contentTypes = await crawlPage(targetUrl, contentTypes);
    }

    const totalCount = Object.values(contentTypes).reduce((a, b) => a + b, 0);

    res.status(200).json({
      pageCount: totalCount,
      contentTypes: contentTypes,
      contentTypeBreakdown: Object.fromEntries(
        Object.entries(contentTypes).map(([key, value]) => [
          key,
          `${((value / totalCount) * 100).toFixed(2)}%`
        ])
      )
    });
  } catch (error) {
    console.error("Error crawling the site:", error.message, error.stack);
    res.status(500).json({ error: "Error crawling the site" });
  }
}