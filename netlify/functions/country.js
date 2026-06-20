// Serverless proxy — runs on Netlify's servers.
// Reads the API key from an environment variable set in the Netlify dashboard.

exports.handler = async function (event) {
  const query = event.queryStringParameters?.name;

  if (!query) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing name parameter" }),
    };
  }

  const apiKey = process.env.COUNTRIES_API_KEY;

  // Guard: if the environment variable isn't set, fail clearly rather than
  // sending "Authorization: Bearer undefined" to the API and getting a confusing rejection response.
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "API key not configured on server" }),
    };
  }

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

    // Pass the status code and body through directly so the frontend
    // receives the same HTTP status the upstream API returned.
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
