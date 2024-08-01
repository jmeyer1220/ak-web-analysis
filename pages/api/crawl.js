import axios from "axios";
import cheerio from "cheerio";
import url from "url";

export default async function handler(req, res) {
  const { url: targetUrl } = req.query;
  
  try {
    const { data } = await axios.get(targetUrl);
    const $ = cheerio.load(data);
    const links = $("a");
    
    const contentTypes = {
      pages: 0,
      events: 0,
      sermons: 0,
      news: 0,
      blog: 0,
      other: 0
    };

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

    const totalCount = Object.values(contentTypes).reduce((a, b) => a + b, 0);

    res.status(200).json({ contentTypes, totalCount });
  } catch (error) {
    console.error("Error crawling the site:", error.message, error.stack);
    res.status(500).json({ error: "Error crawling the site" });
  }
}