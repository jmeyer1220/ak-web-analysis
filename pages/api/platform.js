import axios from "axios";

export default async function handler(req, res) {
  let { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "URL parameter is required" });
  }

  // Remove the protocol (http:// or https://) if present
  url = url.replace(/^https?:\/\//, "");

  try {
    const apiKey = process.env.WHATCMS_API_KEY; // Replace with your actual WhatCMS API key
    const response = await axios.get(
      `https://whatcms.org/API/Tech?key=${apiKey}&url=${url}`,
    );

    // Log the full response to inspect
    console.log("WhatCMS API response:", response.data);

    const results = response.data.results || [];
    let cms = [];
    let hosting = [];
    let otherTechnologies = [];

    // Categorize technologies into CMS and hosting
    results.forEach((tech) => {
      if (tech.categories.includes("CMS")) {
        cms.push(tech);
      } else if (tech.categories.includes("Hosting")) {
        hosting.push(tech);
      } else {
        otherTechnologies.push(tech);
      }
    });

    res.status(200).json({ cms, hosting, otherTechnologies });
  } catch (error) {
    console.error(
      "Error detecting technologies:",
      error.message,
      error.response?.data || error.stack,
    );
    res.status(500).json({ error: "Error detecting technologies" });
  }
}
