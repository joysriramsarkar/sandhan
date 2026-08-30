# Sondhan Deployment Guide — VPS + Tor (.onion)

## 1. Quick Docker Deployment
```bash
docker compose -f deploy/docker-compose.prod.yml up -d
```

## 2. Reverse Proxy (Caddy)
```caddy
sondhan.example.com {
    reverse_proxy localhost:8080
    header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
    header X-Content-Type-Options "nosniff"
    header X-Frame-Options "DENY"
}
```

## 3. Tor Onion Hidden Service
Add to `/etc/tor/torrc`:
```torrc
HiddenServiceDir /var/lib/tor/sondhan/
HiddenServicePort 80 127.0.0.1:8080
```
Restart Tor and read hostname: `cat /var/lib/tor/sondhan/hostname`.
