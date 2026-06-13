// Serverless proxy — fetches border country data for a given list of
// ISO alpha-3 codes. Runs on Netlify's servers, never in the browser.

exports.handler = async function (event) {
  const codes = event.queryStringParameters?.codes;

  // No codes provided — return empty list rather than making a pointless request.
  if (!codes) {
    return {
      statusCode: 200,
      body: JSON.stringify({ data: { objects: [] } }),
    };
  }

  const apiKey = process.env.COUNTRIES_API_KEY;

  // Guard: fail clearly if the environment variable isn't configured.
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "API key not configured on server" }),
    };
  }

  try {
    const response = await fetch(
      `https://api.restcountries.com/countries/v5?codes.alpha_3=${codes}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    const data = await response.json();

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
