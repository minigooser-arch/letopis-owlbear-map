# Letopis Map Sync 1.0.0

Первый GitHub-only релиз отдельного Owlbear Rodeo extension.

- Удалена необходимость устанавливать exporter/extension на VPS.
- Нет systemd, отдельного Linux-пользователя и каталога публикации на Minecraft-сервере.
- GitHub Actions скачивает публичные BlueMap low-res PNG напрямую с `map.letopisrp.ru`.
- Используется точное кодирование путей BlueMap 5.16 `FileGridStorage`; например `(0,-20) → x0/z-2/0.png`.
- Для текущей границы X `[-5760,12640)`, Z `[-16720,-6960)` скачивается 798 исходных PNG.
- Публикуется 18 стратегических PNG `2000×2000`, каждый покрывает `4000×4000` блоков.
- GitHub Pages одновременно хостит Owlbear Extension и каталог `map/`.
- Extension написан без UI-фреймворка: TypeScript + Owlbear SDK + минимальный HTML/CSS.
- PNG не входят в JS bundle и используются как внешние URL-изображения Owlbear.
- Map URL выводится относительно текущего GitHub Pages subpath, поэтому не зависит от имени репозитория.
- Добавлены координаты Minecraft X/Z, чанки и копирование `/tp`.
- Revision учитывает GitHub run attempt, поэтому Re-run не переиспользует старый cache key.
- После deploy проверяется CORS опубликованного PNG.
- Scheduled workflow поддерживает ежемесячную activity-marker запись, чтобы публичный cron не отключился после длительного отсутствия ручных коммитов.
