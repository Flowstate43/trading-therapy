# TradingTherapy

Static site for Mikey's TradingTherapy crypto channel: a daily trading therapy and crypto newsletter for beginners and advanced traders.

## Links

- Repository: https://github.com/Flowstate43/trading-therapy
- Live site: https://flowstate43.github.io/trading-therapy/
- Channel: [Join us on Messenger](https://m.me/j/AbY7Lx_SSPZwO3t6/)

## Stack

Plain HTML, CSS, and JavaScript. No build step. GitHub Pages serves the files from the `main` branch root.

## Editing

- `index.html` — page structure and copy
- `beginner-lessons.html` — Beginner Lessons page (renders from `beginner-lessons.json`)
- `styles.css` — layout (header, hero, card grid, panels) and pastel theme
- `app.js` — live market stats and rendering for newsletter / lessons
- `newsletter.json` — daily newsletter archive (`posts` array: `date`, `title`, `teaser`, optional `sample` or `placeholder`)
- `lessons.json` — Trading Learning cards (`lessons` array: `title`, `blurb`, `status`)
- `beginner-lessons.json` — Beginner Lessons archive. A JSON array of lesson objects. To add the next lesson, append one entry; old lessons stay. Entry format:

  `{"number":N,"title":"...","date":"YYYY-MM-DD","bullets":["🔑 ...", ...]}`

Live stats (prices, 24h change, BTC dominance, Fear & Greed) refresh in the browser every 90 seconds from CoinGecko and alternative.me. No API keys. Last good values are cached in `localStorage`.

## Disclaimer

Not financial advice. For education and entertainment only.
