# Letopis map builder

Python-компонент запускается в GitHub Actions, а не на Minecraft-сервере.

Он вычисляет публичные URL low-res BlueMap 5.16, скачивает только исходные тайлы, пересекающие текущую границу, и собирает готовый статический каталог `map/` для GitHub Pages.

Локальный запуск (при наличии доступа к `map.letopisrp.ru`):

```bash
python -m pip install -e './exporter[test]'
pytest exporter/tests -q
letopis-map-export --config exporter/config.example.yml build --output build/map --revision 1
```
