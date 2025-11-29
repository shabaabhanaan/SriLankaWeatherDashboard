import fetch from "node-fetch";

export default async function handler(req, res) {
    const API_KEY = process.env.3491013404034ab1b5bfead1c09ffb2a;

    const url = `https://api.worldnewsapi.com/search-news?source-country=lk&api-key=${API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    res.status(200).json({
        news: data.news || []
    });
}
