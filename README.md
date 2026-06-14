# Global Index — Country Explorer

A country search app built with vanilla HTML, CSS (Tailwind), and JavaScript,
deployed on Netlify with serverless functions as a secure API proxy.

**[Live Demo →](https://your-site.netlify.app)** &nbsp;|&nbsp; **[View Code →](https://github.com/your-username/global-index)**

---

## Features

- Real-time country search via REST Countries API v5
- Serverless proxy keeps API key off the client entirely
- Dynamic membership badges (UN, EU, NATO, G7, G20, BRICS and more)
- Live embedded OpenStreetMap centred on the searched country
- Neighbouring country grid with ISO alpha-3 codes
- CRT-inspired terminal UI built with Google Stitch + Tailwind CSS

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5 · Tailwind CSS (CDN) · Vanilla JavaScript |
| Icons | Google Material Symbols |
| API | REST Countries API v5 |
| Proxy / Hosting | Netlify Functions · Netlify |

## Architecture

The browser never calls the REST Countries API directly. Instead it calls a
Netlify serverless function that holds the API key in an environment variable
and proxies the request server-side. This keeps the key out of the client
bundle and off GitHub entirely.

```
Browser → /.netlify/functions/country → REST Countries API v5
Browser → /.netlify/functions/borders → REST Countries API v5
```

## Local Setup

1. Clone the repo
2. Copy `.env.example` to `.env` and add your REST Countries API key
3. Install the Netlify CLI: `npm install -g netlify-cli`
4. Run `netlify dev` — serves the site at `http://localhost:8888` with
   functions active

A free API key is available at [restcountries.com](https://restcountries.com).

## Built With

Google Stitch was used to generate the initial UI scaffold and dark theme
colour system. All API integration, serverless proxy functions, data mapping,
and dynamic rendering logic were hand-coded.

---

*Built 2025 · Data via REST Countries API v5 · If data appears missing, the API may have changed*
