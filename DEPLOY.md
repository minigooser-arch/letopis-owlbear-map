# Первичная установка Letopis Map Sync

На VPS ничего устанавливать не нужно. Репозиторий GitHub хранит исходники, GitHub Actions выполняет exporter и сборку расширения, а GitHub Pages раздаёт готовый extension и карту.

## 1. Репозиторий

Рекомендуемое имя: `letopis-owlbear-map`.

Для автоматической загрузки через GitHub-коннектор достаточно создать **public**-репозиторий с веткой `main` и начальным `README` (то есть не полностью пустой). После этого все файлы проекта можно загрузить одним коммитом через GitHub API.

Если файлы загружаются вручную, в корне репозитория должны находиться как минимум:

```text
.github/
contracts/
exporter/
extension/
scripts/
DEPLOY.md
README.md
RELEASE-NOTES.md
```

## 2. GitHub Pages

В GitHub открой:

**Settings → Pages → Build and deployment → Source → GitHub Actions**.

Это единственный обязательный серверный/хостинговый переключатель: отдельный VPS-сервис не нужен.

## 3. Первый workflow

Push в `main` автоматически запускает **Build map and deploy Pages**. Его также можно запустить вручную:

**Actions → Build map and deploy Pages → Run workflow**.

Workflow:

1. запускает Python-тесты;
2. скачивает 798 исходных PNG BlueMap, пересекающих текущую границу;
3. собирает 18 стратегических PNG `2000×2000`;
4. устанавливает зависимости extension;
5. запускает Vitest;
6. выполняет TypeScript/Vite production build;
7. собирает единый GitHub Pages artifact;
8. проверяет manifest, границу и все 18 PNG;
9. публикует Pages;
10. проверяет CORS уже на опубликованном PNG.

Если build не проходит, новая версия Pages не публикуется.

## 4. Адрес расширения

При репозитории `minigooser-arch/letopis-owlbear-map` ожидаемый адрес:

```text
https://minigooser-arch.github.io/letopis-owlbear-map/manifest.json
```

Карта публикуется рядом:

```text
https://minigooser-arch.github.io/letopis-owlbear-map/map/current.json
https://minigooser-arch.github.io/letopis-owlbear-map/map/manifest.json
https://minigooser-arch.github.io/letopis-owlbear-map/map/tiles/...
```

## 5. Установка в Owlbear Rodeo

В профиле Owlbear добавь custom extension по URL `manifest.json`, затем включи **«Летопись: карта Minecraft»** в нужной комнате. Room ID в проекте не хранится: SDK работает в контексте комнаты, в которой extension включён.

## 6. Одноразовая привязка карты

Открой нужную сцену как GM:

1. открой действие **«Карта Minecraft»**;
2. нажми **«Привязать карту»**;
3. кликни по пересечению сетки Owlbear, которое должно соответствовать Minecraft `(0,-10000)`;
4. нажми **«Синхронизировать сейчас»**.

Эта точка считается верхним правым углом опорной клетки. Одна клетка Owlbear соответствует `160×160` блокам Minecraft.

## 7. Проверка

После синхронизации должно появиться 18 заблокированных изображений на слое `MAP`.

В инструменте **«Координаты Minecraft»** на самой точке привязки должно показываться:

```text
X: 0
Z: -10000
Chunk: 0, -625
```

Также визуально проверь один известный объект/береговую линию на карте. Это финальная проверка того, как Owlbear трактует origin URL-изображения в реальной сцене.

## 8. Последующие обновления

Ничего на сервере запускать не требуется. Workflow публикует новую revision автоматически. При следующем открытии сцены GM расширение видит новую revision и синхронизирует URL существующих изображений.

Повторный запуск одного и того же GitHub workflow тоже получает новую revision: она учитывает и `GITHUB_RUN_NUMBER`, и `GITHUB_RUN_ATTEMPT`, поэтому кэш не должен сохранить старый PNG после Re-run.

## 9. Изменение границы мира

Текущая конфигурация находится в `exporter/config.example.yml`:

```yaml
border:
  source: corners
  minX: -5760
  maxXExclusive: 12640
  minZ: -16720
  maxZExclusive: -6960
```

`maxXExclusive` и `maxZExclusive` — линии после последнего включённого блока. Например, если последний блок Chunky имеет X `12639`, в exporter указывается `12640`.

При сознательной смене границы обнови также ожидаемую границу/количество PNG в `scripts/verify-pages.py`. Сам алгоритм exporter не зашит на число 18.

## 10. Что остаётся на VPS

Только уже существующая BlueMap и её публичные low-res PNG:

```text
Minecraft → BlueMap → https://map.letopisrp.ru/maps/world/tiles/1/...
```

Letopis Map Sync не устанавливает пользователей Linux, systemd-сервисы, Python, Node.js или дополнительные nginx-location на VPS.
