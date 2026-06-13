exports.handler = async function (event) {
  const codes = event.queryStringParameters?.codes;

  if (!codes) {
    return {
      statusCode: 200,
      body: JSON.stringify({ data: { objects: [] } }),
    };
  }

  const apiKey = process.env.COUNTRIES_API_KEY;

  try {
    // v5 filter by alpha_3 codes — comma separated
    const response = await fetch(
      `https://api.restcountries.com/countries/v5?codes.alpha_3=${codes}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      },
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
