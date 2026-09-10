# Letopis Owlbear Extension

Минимальное расширение Owlbear Rodeo. Оно не обрабатывает BlueMap и не содержит PNG карты в bundle.

Расширение загружается с GitHub Pages, читает `./map/current.json` + `./map/manifest.json` с того же Pages-сайта и передаёт готовые URL PNG объектам Owlbear `IMAGE`.

Функции:

- одноразовая привязка Minecraft `(0,-10000)` к углу клетки Owlbear;
- GM-синхронизация карты;
- автоматическая проверка новой revision при открытии сцены;
- X/Z и chunk под курсором;
- копирование `X Z` и `/tp X ~ Z`.
