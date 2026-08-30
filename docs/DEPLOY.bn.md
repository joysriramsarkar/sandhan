# সন্ধান ডিপ্লয়মেন্ট নির্দেশিকা — ভিপিএস ও টর (.onion)

[English Deployment Guide](DEPLOY.md) | [বাংলা সংস্করণ](DEPLOY.bn.md)

## ১. দ্রুত ডকার ডিপ্লয়মেন্ট
```bash
docker compose up -d
```

## ২. রিভার্স প্রক্সি কনফিগারেশন (Caddy)
```caddy
sandhan.site {
    reverse_proxy localhost:3000
    header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
    header X-Content-Type-Options "nosniff"
    header X-Frame-Options "DENY"
}
```

## ৩. টর অনিয়ন সার্ভিস (.onion)
আপনার `/etc/tor/torrc` ফাইলে যুক্ত করুন:
```torrc
HiddenServiceDir /var/lib/tor/sandhan/
HiddenServicePort 80 127.0.0.1:3000
```
টর পুনরায় চালু করে হোস্টনেম দেখুন: `cat /var/lib/tor/sandhan/hostname`
