import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'high-signal'
  const [scrapeStatus, setScrapeStatus] = useState('');

  const fetchNews = async () => {
    setLoading(true);
    try {
      const endpoint = filter === 'high-signal' 
        ? 'http://localhost:8000/api/news?filter=high-signal'
        : 'http://localhost:8000/api/news';
      
      const res = await fetch(endpoint);
      const data = await res.json();
      setArticles(data);
    } catch (err) {
      console.error("Error fetching news:", err);
    } finally {
      setLoading(false);
    }
  };

  const cleanText = (text) => {
    if (!text) return "";
    return text.replace(/<[^>]*>?/gm, ''); // Simple strip tags
  };

  const handleScrape = async () => {
    setScrapeStatus('Scraping started... (check server logs)');
    try {
      const res = await fetch('http://localhost:8000/api/scrape', { method: 'POST' });
      const data = await res.json();
      setScrapeStatus(data.message);
      
      // Poll or reload after a delay to see new results
      setTimeout(() => {
          setScrapeStatus('Refreshing data...');
          fetchNews();
      }, 5000);

    } catch (err) {
      setScrapeStatus('Scrape failed to start');
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [filter]);

  return (
    <div className="container">
      <div className="header">
        <h1>Stats: {articles.length} Articles</h1>
        
        <div className="actions">
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="all">All News</option>
                <option value="high-signal">High Signal (Top 10)</option>
            </select>
            
            <button onClick={fetchNews} disabled={loading}>
                Refresh
            </button>

            <button onClick={handleScrape} style={{backgroundColor: '#e63946'}}>
                Trigger Scraper
            </button>
        </div>
      </div>

      {scrapeStatus && <div style={{padding: '10px', background: '#e0e0e0', marginBottom: '20px'}}>{scrapeStatus}</div>}

      {loading ? (
        <p>Loading articles...</p>
      ) : articles.length === 0 ? (
        <div style={{textAlign: 'center', padding: '2rem'}}>
            <h2>No articles found 📭</h2>
            <p>Try triggering the scraper to fetch fresh news.</p>
        </div>
      ) : (
        <div className="grid">
            {articles.map(article => (
                <div key={article.id} className={`card ${article.curatorScore >= 70 ? 'high-signal' : ''}`}>
                    <small>{new Date(article.publishedAt).toLocaleDateString()} • Score: <strong>{article.curatorScore || 0}</strong></small>
                    <h3>
                        <a href={article.url} target="_blank" rel="noopener noreferrer">
                            {article.title}
                        </a>
                    </h3> 
                    
                    {article.aiSummary ? (
                        <div style={{background: '#f8f9fa', padding: '10px', borderRadius: '5px', marginTop: '10px'}}>
                            <strong>🤖 AI Take:</strong>
                            <p>{cleanText(article.aiSummary)}</p>
                        </div>
                    ) : (
                        <p>{article.description}</p>
                    )}
                    
                    <div style={{marginTop: '10px', fontSize: '12px', color: '#666'}}>
                        Source: {article.sourceName || "Unknown"}
                    </div>
                </div>
            ))}
        </div>
      )}
    </div>
  )
}

export default App
