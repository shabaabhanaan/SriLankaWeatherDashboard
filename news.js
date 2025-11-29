import fetch from "node-fetch";

export default async function handler(req, res) {
    const API_KEY = process.env.WORLDNEWS_API_KEY;

    const url = `https://api.worldnewsapi.com/search-news?source-country=lk&api-key=${API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    res.status(200).json({
        news: data.news || []
    });
}
