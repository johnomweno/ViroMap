// This is a Vercel Serverless Function (Node.js runtime)
// File path: /api/gemini.js

export default async function handler(request, response) {
    // 1. Only allow POST requests
    if (request.method !== 'POST') {
        response.status(405).json({ error: 'Method Not Allowed' });
        return;
    }

    // 2. Get the prompt from the frontend's request body
    const { prompt } = request.body;

    if (!prompt) {
        response.status(400).json({ error: 'Prompt is missing' });
        return;
    }

    // 3. Get the SECRET API key from environment variables
    // We will set this up in Vercel in the next step.
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error("Server configuration error: API key is missing.");
        response.status(500).json({ error: 'Server configuration error. Contact site admin.' });
        return;
    }

    // 4. Call the real Google Gemini API (this is the same logic as before)
    const googleApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
    const payload = { contents: [{ parts: [{ text: prompt }] }] };

    try {
        const apiResponse = await fetch(googleApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!apiResponse.ok) {
            // Forward the error from Google's API
            const errorBody = await apiResponse.text();
            console.error("Google API Error:", errorBody);
            response.status(apiResponse.status).json({ error: `Google API failed: ${apiResponse.statusText}` });
            return;
        }

        const result = await apiResponse.json();
        const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text;

        // 5. Send the successful response back to the frontend
        // We send it as an object: { text: "..." }
        response.status(200).json({ text: generatedText || "Sorry, I couldn't generate a response." });

    } catch (error) {
        console.error("Internal Server Error:", error);
        response.status(500).json({ error: `An internal server error occurred: ${error.message}` });
    }
}
