# Steward

Домашний список покупок: React-клиент и Express API. Данные живут в `db/shop-list.json`.

## Домашний сервер

Чтобы держать приложение на ноутбуке в LAN (для телефонов в доме), есть два пути: Docker и обычный запуск через терминал после `npm run build`. Пошагово — в [docs/home-server.md](docs/home-server.md).

## Разработка

```bash
cp .env.example .env
npm install
npm run dev
```

Клиент: http://localhost:8000  
API: http://localhost:65080 (`/api/health`, `/api/state`)

В dev без `.env` сервер принимает токен `dev-token`, клиент подставляет его сам. В production токен обязателен: `STEWARD_TOKEN` и экран ввода на клиенте.

`npm run dev` включает React StrictMode — эффекты (включая fetch) срабатывают дважды. Это нормально. Лишние циклы проверяйте через `npm run build` и `node server/index.js` или Docker-образ, не через dev-сервер.

## Оффлайн

Оболочка кэшируется service worker (vite-plugin-pwa). Списки и очередь правок хранятся в `localStorage`. Без сети открывается последний снимок, его можно редактировать. В шапке статус: онлайн / оффлайн / синхронизация. `/api/*` в SW не кэшируется.
