Assets folder for electron-builder build resources.

- Place the image named `icon` here (e.g. `icon.png` or `icon.ico`). The build is configured to use `assets/icon.png` for Windows.
- For best results on Windows provide a `.ico` file. To convert a PNG to ICO with ImageMagick:

```
convert icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico
```

Note: electron-builder can convert a PNG to ICO during packaging, but that step may require additional native tools and permissions on your machine.
