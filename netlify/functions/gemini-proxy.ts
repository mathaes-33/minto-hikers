import { GoogleGenAI } from "@google/genai";
import type { Handler, HandlerEvent } from "@netlify/functions";

// This function runs on the server, where process.env is securely available.
const API_KEY = process.env.API_KEY;

const ai = new GoogleGenAI({ apiKey: API_KEY || "" });

const handler: Handler = async (event: HandlerEvent) => {
  // Ensure the API key is configured on the server.
  if (!API_KEY) {
    console.error("API_KEY environment variable is not set in Netlify function.");
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Server configuration error: The API key is not configured." })
    };
  }

  if (event.httpMethod !== "POST") {
    return { 
      statusCode: 405, 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Method Not Allowed" }) 
    };
  }

  try {
    const { prompt, schema } = JSON.parse(event.body || "{}");

    if (!prompt || !schema) {
      return { 
        statusCode: 400, 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Bad Request: 'prompt' and 'schema' are required in the request body." }) 
      };
    }

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: schema,
        },
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: response.text }),
    };
  } catch (error) {
    console.error("Error in Netlify Gemini proxy function:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown internal server error occurred.";
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Failed to generate content from the AI service.", details: errorMessage }),
    };
  }
};

export { handler };
