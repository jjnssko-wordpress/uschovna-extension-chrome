# Úschovna – export názvů souborů

Chrome extension, který na stránku zásilky `https://www.uschovna.cz/zasilka/...`
přidá tlačítko **„Exportovat názvy souborů“**. Po kliknutí se otevře okno se
seznamem všech názvů, seznam se rovnou zkopíruje do schránky a jde stáhnout
jako `.txt`. Žádné psaní příkazů do konzole.

## Instalace (režim pro vývojáře)

1. Otevři `chrome://extensions`.
2. Zapni vpravo nahoře **Režim pro vývojáře** / **Developer mode**.
3. Klikni na **Načíst nerozbalené** / **Load unpacked**.
4. Vyber tuto složku (`uschovna-extension-chrome`).
5. Otevři libovolnou zásilku na `uschovna.cz` – v řádku s tlačítkem
   „stáhnout vše jako zip“ se objeví tlačítko **Exportovat názvy souborů**.

## Jak to funguje

- Názvy souborů se čtou z elementů `.soubor .title`.
- Tlačítko se vkládá do bloku `.package-buttons`; pokud by se layout webu
  změnil, použije se plovoucí tlačítko vpravo dole.
- Funguje i pro jazykové varianty (`/en/zasilka/...`, `/sk/zasilka/...`).

## Soubory

| Soubor          | Popis                                          |
|-----------------|------------------------------------------------|
| `manifest.json` | Definice extensionu (Manifest V3)              |
| `content.js`    | Logika – tlačítko, sběr názvů, kopírování      |
| `content.css`   | Styl tlačítka, modálního okna a bubliny        |
