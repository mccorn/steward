# Запуск Steward на домашнем сервере

Инструкция для ноутбука в домашней сети: один процесс слушает порт **65080** и отдаёт и веб-интерфейс, и API. Данные списков — файл `db/shop-list.json`.

Два сценария:

1. [Docker](#1-docker) — удобно, если Docker уже стоит; обновление образа отдельно от данных.
2. [Терминал без Docker](#2-запуск-через-терминал) — Node.js, сборка, `node server/index.js`.

После старта откройте в браузере `http://<IP-ноутбука>:65080/` (или `http://localhost:65080/` на самой машине). При первом заходе production попросит **ключ доступа** — тот же, что в `STEWARD_TOKEN`.

Это не режим разработки. `npm run dev` (Vite на 8000 + nodemon) для домашнего сервера не используйте.

---

## Что подготовить

- Ноутбук в той же Wi‑Fi / LAN, что и телефоны.
- Открытый порт **65080** во входящем брандмауэре.
- Секрет `STEWARD_TOKEN` (любая длинная строка). Его будут вводить в приложении один раз; он хранится в браузере.

Узнать IP в домашней сети:

- Windows (PowerShell): `Get-NetIPAddress -AddressFamily IPv4 | Select IPAddress`
- Linux / macOS: `ip a` или `ifconfig`

---

## 1. Docker

Нужны Docker Engine и Docker Compose v2 (`docker compose version`).

### Вариант A. Репозиторий уже клонирован

Из корня проекта:

```bash
docker build -t steward .
```

Запуск (Linux / macOS / Git Bash):

```bash
docker run -d --name steward --restart unless-stopped \
  -p 65080:65080 \
  -e NODE_ENV=production \
  -e PORT=65080 \
  -e STEWARD_TOKEN=замените-на-свой-секрет \
  -v steward-data:/app/db \
  steward
```

Windows (PowerShell):

```powershell
docker run -d --name steward --restart unless-stopped `
  -p 65080:65080 `
  -e NODE_ENV=production `
  -e PORT=65080 `
  -e STEWARD_TOKEN=замените-на-свой-секрет `
  -v steward-data:/app/db `
  steward
```

Том `steward-data` переживает пересборку образа. Списки не пропадут, пока том не удалите.

Проверка: `http://127.0.0.1:65080/api/health` должен ответить `{"ok":true}`.

Логи: `docker logs -f steward`  
Остановка: `docker stop steward`  
Запуск снова: `docker start steward`

Обновление из git:

```bash
git pull
docker build -t steward .
docker stop steward
docker rm steward
```

Затем снова `docker run ...` с теми же `-e` и `-v`. Том с `db` подключится заново.

### Вариант B. На машине только compose, без клона репозитория

Docker сам клонирует git на время сборки.

1. Скопируйте на ноутбук [`deploy/docker-compose.yml`](../deploy/docker-compose.yml) и [`deploy/.env.example`](../deploy/.env.example).
2. Переименуйте пример в `.env` рядом с compose-файлом.
3. Заполните:

```env
STEWARD_TOKEN=замените-на-свой-секрет
STEWARD_GIT_REPO=https://github.com/mccorn/steward.git
STEWARD_GIT_REF=master
```

Приватный репозиторий: HTTPS-токен в URL либо SSH-remote, к которому у Docker-хоста уже есть ключ.

4. Запуск:

```bash
docker compose -f docker-compose.yml up -d --build
```

Обновление:

```bash
docker compose -f docker-compose.yml build --pull
docker compose -f docker-compose.yml up -d
```

Данные — named volume `steward-data`.

---

## 2. Запуск через терминал

Нужен **Node.js 22** (LTS). Проверка: `node -v`.

### Установка и сборка

```bash
git clone https://github.com/mccorn/steward.git
cd steward
npm ci
```

Создайте `.env` в корне (файл не коммитится):

```env
NODE_ENV=production
PORT=65080
STEWARD_TOKEN=замените-на-свой-секрет
```

Соберите клиент (Express раздаёт папку `dist/`):

```bash
npm run build
```

### Старт

Linux / macOS:

```bash
export NODE_ENV=production
node server/index.js
```

Windows (PowerShell):

```powershell
$env:NODE_ENV = "production"
node server/index.js
```

`dotenv` подхватит `.env`, поэтому `STEWARD_TOKEN` и `PORT` можно не экспортировать, если они уже в файле. **`NODE_ENV=production` лучше задать явно** — без него сервер считает окружение dev и принимает `dev-token`.

В консоли должно появиться `Listen 65080 on 0.0.0.0`. Остановка: `Ctrl+C`.

Не закрывайте терминал, пока сервер должен работать. Чтобы процесс пережил выход из SSH / закрытие окна:

- Linux: `systemd` user-unit или `tmux` / `screen`
- Windows: планировщик заданий («при входе в систему») или NSSM; либо просто свернуть окно и не выключать ноутбук

После `git pull` снова `npm ci`, `npm run build` и перезапуск `node server/index.js`. Файл `db/shop-list.json` не пересобирается — его не удаляйте.

---

## Брандмауэр

Разрешите входящие TCP **65080**, иначе с телефона страница не откроется.

Windows:

```powershell
New-NetFirewallRule -DisplayName "Steward" -Direction Inbound -Protocol TCP -LocalPort 65080 -Action Allow
```

Linux (ufw):

```bash
sudo ufw allow 65080/tcp
```

Спящий режим ноутбука оборвёт доступ. Для «всегда в LAN» отключите сон при питании от сети.

---

## Если что-то не так

| Симптом | Что проверить |
|--------|----------------|
| `EADDRINUSE ... 65080` | Порт занят другим Node/Docker. Windows: `netstat -ano \| findstr :65080`, затем `taskkill /PID <pid> /F`. |
| `STEWARD_TOKEN is required` | Задан `NODE_ENV=production`, но токена нет в `.env` / `-e`. |
| Страница есть, API 401 | В форме ключ должен совпадать с `STEWARD_TOKEN`. |
| `{"ok":true}` на `/api/health`, UI пустой | Открывайте именно порт **65080**, не Vite `:8000`. |
| После пересборки Docker списки пропали | Запускали без `-v steward-data:/app/db`. |

Режим разработки на той же машине: `npm run dev` — клиент `:8000`, API `:65080`. Для семьи в LAN используйте только production на **65080**.
