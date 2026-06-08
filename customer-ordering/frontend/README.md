# Customer Ordering Page Prototype

Static customer ordering page for the Venture Sense group-buy MVP.

## What it does

- Loads sample group-buy data from `catalogue.json`
- Displays a mobile-first grocery catalogue
- Lets customers add quantities to cart
- Collects buyer details and substitution preference
- Creates a provisional order
- Saves submitted order data in browser `localStorage`
- Lets you export submitted orders as JSON or CSV for dashboard integration

## How to run

From this folder:

```bash
python3 -m http.server 8000
```

Then open:

```txt
http://localhost:8000
```

## Integration note

For real backend integration later, replace the localStorage logic in `app.js` with a `POST /orders` API request.
