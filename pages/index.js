import { useState } from "react";
import axios from "axios";

export default function Analyze() {
  const [url, setUrl] = useState("");
  const [pageCount, setPageCount] = useState(null);
  const [cms, setCms] = useState([]);
  const [hosting, setHosting] = useState([]);
  const [otherTechnologies, setOtherTechnologies] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [content, setContent] = useState(null);
  const [error, setError] = useState(null);
  const [isAnalyzed, setIsAnalyzed] = useState(false); // New state variable
  const [contentTypes, setContentTypes] = useState({});
const [contentTypeBreakdown, setContentTypeBreakdown] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setPageCount(null);
    setCms([]);
    setHosting([]);
    setOtherTechnologies([]);
    setPerformance(null);
    setIsAnalyzed(false); // Reset analysis status

    try {
      const pageAnalysisResponse = await axios.get(`/api/crawl?url=${url}`);
      setPageCount(pageAnalysisResponse.data.pageCount);
      setContentTypes(pageAnalysisResponse.data.contentTypes);
      setContentTypeBreakdown(pageAnalysisResponse.data.contentTypeBreakdown);
  
      // Fetch technologies
      const technologiesResponse = await axios.get(`/api/platform?url=${url}`);
      setCms(technologiesResponse.data.cms);
      setHosting(technologiesResponse.data.hosting);
      setOtherTechnologies(technologiesResponse.data.otherTechnologies);

      // Fetch performance
      /*const performanceResponse = await axios.get(
        `/api/performance?url=${url}`,
      );
      setPerformance(performanceResponse.data.performance);*/

      setIsAnalyzed(true); // Set analysis status to true
    } catch (err) {
      console.error(
        "Error fetching data:",
        err.response?.data || err.message,
        err.stack,
      );
      setError("Error fetching data. Check the console for more details.");
    }
  };

  const handleScrape = async (e) => {
    e.preventDefault();
    setError(null);
    setContent(null);

    try {
      // Fetch content
      const contentResponse = await axios.get(`/api/scrape?url=${url}`);
      setContent(contentResponse.data.content);
    } catch (err) {
      console.error(
        "Error scraping content:",
        err.response?.data || err.message,
        err.stack,
      );
      setError("Error scraping content. Check the console for more details.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-2xl">
        <h1 className="text-4xl font-bold mb-4 text-center text-gray-800">
          Website Analyzer
        </h1>
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex items-center space-x-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter website URL"
              required
              className="flex-1 p-2 border border-gray-300 rounded"
            />
            <button
              type="submit"
              className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Analyze
            </button>
          </div>
        </form>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        {pageCount !== null && (
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-gray-700">
              Analysis Results:
            </h2>
            <p>
              <strong>Page Count:</strong>
            </p>
            <h3 className="text-xl font-semibold text-gray-700">{pageCount}</h3>
          </div>
          
        )}
        {contentTypes && Object.keys(contentTypes).length > 0 && (
  <div className="mb-4">
    <h3 className="text-xl font-semibold text-gray-700">Content Types:</h3>
    <ul className="list-disc pl-5">
      {Object.entries(contentTypes).map(([type, count]) => (
        <li key={type}>{type}: {count} ({contentTypeBreakdown[type]})</li>
      ))}
    </ul>
  </div>
)}

        {cms.length > 0 && (
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-gray-700">CMS:</h3>
            <ul className="list-disc pl-5">
              {cms.map((tech, index) => (
                <li key={index}>{tech.name}</li>
              ))}
            </ul>
          </div>
        )}

        {hosting.length > 0 && (
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-gray-700">Hosting:</h3>
            <ul className="list-disc pl-5">
              {hosting.map((tech, index) => (
                <li key={index}>{tech.name}</li>
              ))}
            </ul>
          </div>
        )}

        {otherTechnologies.length > 0 && (
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-gray-700">
              Other Technologies:
            </h3>
            <ul className="list-disc pl-5">
              {otherTechnologies.map((tech, index) => (
                <li key={index}>{tech.name}</li>
              ))}
            </ul>
          </div>
        )}

        {performance !== null && (
          <div className="mb-4">
            <p>
              <strong>Performance:</strong> {performance * 100}%
            </p>
          </div>
        )}

        {isAnalyzed && ( // Conditionally render the Scrape Content button
          <form onSubmit={handleScrape} className="mb-8">
            <button
              type="submit"
              className="w-full p-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Scrape Content
            </button>
          </form>
        )}

        {content && (
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-gray-700">
              Scraped Content:
            </h3>
            <pre className="p-2 bg-gray-100 rounded">
              {JSON.stringify(content, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
