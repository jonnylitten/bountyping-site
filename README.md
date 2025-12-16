# BountyPing Frontend

Static frontend for BountyPing, deployed on Cloudflare Pages.

## Configuration

After deploying the backend to Railway, update the `API_URL` in `app.js`:

```javascript
const API_URL = 'https://your-railway-url.up.railway.app';
```

## Deployment

### Cloudflare Pages

1. Push this repo to GitHub
2. Go to Cloudflare Pages dashboard
3. Create new project
4. Connect to GitHub repo
5. Deploy!

No build command needed - this is a static site.

## Local Development

Just open `index.html` in a browser. You'll need the backend API running for data to load.

---

Part of the **\*Ping** family: GovPing, RegPing, GrantPing, BountyPing
