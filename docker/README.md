# IronPath Pocketbase Backend - Unraid Setup

## Quick Start

### 1. Create directories on Unraid

```bash
mkdir -p /mnt/user/appdata/ironpath/pb_data
mkdir -p /mnt/user/appdata/ironpath/pb_migrations
```

### 2. Deploy via Docker Compose

Using Unraid's Docker Compose Manager or manually:

```yaml
version: '3.8'

services:
  pocketbase:
    image: ghcr.io/muchobien/pocketbase:latest
    container_name: ironpath-pocketbase
    restart: unless-stopped
    ports:
      - "8090:8090"
    volumes:
      - /mnt/user/appdata/ironpath/pb_data:/pb_data
      - /mnt/user/appdata/ironpath/pb_migrations:/pb_migrations
    environment:
      TZ: America/Los_Angeles
```

### 3. Initial Setup

1. Access the admin UI at `http://YOUR_UNRAID_IP:8090/_/`
2. Create your admin account
3. Import the schema:
   - Go to Settings → Import Collections
   - Paste contents of `pb_schema.json`
   - Click Import

### 4. Configure the Frontend

Create `.env.local` in the IronPath project root:

```
VITE_POCKETBASE_URL=http://YOUR_UNRAID_IP:8090
GEMINI_API_KEY=your_gemini_key_here
```

## Collections

| Collection | Purpose |
|------------|---------|
| `users` | Built-in auth (email/password) |
| `workouts` | Workout sessions, templates, history |
| `user_settings` | User preferences, PRs, goals |
| `daily_logs` | Sleep, protein, water tracking |

## Security Notes

- All collections have row-level security (users can only access their own data)
- Consider setting up a reverse proxy (nginx/Caddy) with HTTPS for external access
- Pocketbase stores data in SQLite - backup `/pb_data` regularly

## Backup

Add to Unraid's backup routine or cron:

```bash
# Backup Pocketbase data
cp -r /mnt/user/appdata/ironpath/pb_data /mnt/user/backups/ironpath-$(date +%Y%m%d)
```

## Reverse Proxy (Optional)

If using Nginx Proxy Manager on Unraid:

1. Add proxy host pointing to `ironpath-pocketbase:8090`
2. Enable SSL with Let's Encrypt
3. Update `VITE_POCKETBASE_URL` to use HTTPS domain
