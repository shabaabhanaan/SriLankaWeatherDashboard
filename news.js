import fetch from "node-fetch";

export default async function handler(req, res) {
    const API_KEY = process.env.NEWS_API_KEY;

    if (!API_KEY) {
        return res.status(500).json({ error: "API Key missing" });
    }

    const url = `https://api.worldnewsapi.com/search-news?source-country=lk&api-key=${API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        res.status(200).json({
            news: data?.news || []
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to load news" });
    }
}
