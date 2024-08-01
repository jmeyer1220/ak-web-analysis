import fetch from "node-fetch";

export default async function handler(req, res) {
  const { url } = req.query;
  const apiKey = process.env.FIRECRAWL_API_KEY;

  if (!url) {
    return res.status(400).json({ error: "URL parameter is required" });
  }

  // Ensure the URL includes the protocol (http:// or https://)
  const targetUrl = /^https?:\/\//.test(url) ? url : `https://${url}`;

  const options = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: targetUrl,
      pageOptions: {
        headers: {},
        includeHtml: true,
        includeRawHtml: true,
        onlyIncludeTags: [],
        onlyMainContent: true,
        removeTags: [],
        replaceAllPathsWithAbsolutePaths: true,
        screenshot: true,
        waitFor: 123,
      },
      extractorOptions: {
        mode: "markdown",
        extractionPrompt: "",
        extractionSchema: {},
      },
      timeout: 60000, // Increase the timeout to 60 seconds
    }),
  };

  try {
    const response = await fetch(
      "https://api.firecrawl.dev/v0/scrape",
      options,
    );
    const content = await response.json();

    if (!response.ok) {
      throw new Error(content.error || "Failed to scrape content");
    }

    res.status(200).json({ content });
  } catch (error) {
    console.error("Error scraping content:", error.message);
    res.status(500).json({ error: "Error scraping content" });
  }
}
