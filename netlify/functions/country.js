// This runs on Netlify's servers, never in the browser.
// process.env reads the environment variable you set
// in the Netlify dashboard — the key never appears in
// any file that gets committed to GitHub.

exports.handler = async function (event) {
  const query = event.queryStringParameters?.name;

  if (!query) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing name parameter" }),
    };
  }

  const apiKey = process.env.COUNTRIES_API_KEY;

  try {
    const response = await fetch(
      `https://api.restcountries.com/countries/v5/names.common/${encodeURIComponent(query)}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      },
    );

    const data = await response.json();

    // Pass the status code and body through directly
    // so the frontend gets the same error codes
    return {
      statusCode: response.status,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to reach countries API" }),
    };
  }
};
