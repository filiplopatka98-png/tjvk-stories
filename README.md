# tjvk-stories

Generátor videopríbehov 9:16 (FB + IG) pre TJ Veľké Kostoľany — záverečný obraz (PNG) + MP4 s naskakujúcim počítadlom gólov.

```
npm install
node story-video.mjs data/story-vysledok-drahovce.json   # výstup v out/
```

Premenné: `CHROME` = cesta k Chromiu (ak sa verzia Playwrightu nezhoduje s nainštalovaným prehliadačom). Vyžaduje `ffmpeg`.

Formáty JSON: `story-zapas` (8 s), `story-vysledok` (9 s, pole `poradie`: `u` = náš gól, `o` = gól súpera, v skutočnom poradí). Vzory v `data/`.

Kópia z Claude OS (`3 Zdroje/05 Generator-plagatov/`) — pri zmene generátora aktualizuj aj tento repo.
