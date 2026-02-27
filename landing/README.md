# توکان لندینگ (Next.js)

لندینگ توکان با Next.js، Tailwind و Font Awesome.

## توسعه

```bash
npm install
npm run dev
```

باز کردن [http://localhost:3001](http://localhost:3001)

## ساخت و دیپلوی

```bash
npm run build
```

خروجی استاتیک در `out/` تولید می‌شود.

### Docker (Production)

```bash
docker build -t tokan-landing .
docker run -p 80:80 tokan-landing
```

برای دیپلوی واقعی، nginx در پشت reverse proxy (مثلاً traefik یا nginx اصلی) قرار می‌گیرد و SSL را هندل می‌کند.
