# 🦉 Mohamed's Adventure

A fun English learning game for kids (age 5+). A friendly owl guides the child
through worlds where he learns the **alphabet**, **numbers** and **first words**
by playing mini-games, earning stars and collecting stickers.

It's a web app that installs on an iPhone like a real app: it gets a Home Screen
icon, opens full-screen and works offline. No App Store is needed.

## Version 1 – what's inside

| World | What he learns | Mini-games |
|---|---|---|
| 🏖️ **Alphabet Beach** | Letters A–Z, big & small letters, "A is for Apple" | Letter cards, Balloon Pop, Which letter does it start with?, Find the small letter, Which picture starts with…? |
| 🌴 **Number Jungle** | Numbers 1–20, counting | Number cards (tap to count), How many?, Balloon Pop, Feed the Monkey, What comes next? |
| 🐮 Word Farm | *(coming in Version 2)* | |
| 🏰 Spelling Castle | *(coming in Version 2)* | |
| 🌳 Talking Tree | *(coming in Version 3)* | |

- Every instruction is **spoken out loud**, so he doesn't need to read yet (tap the owl to hear it again).
- Wrong answers just wiggle and he tries again. There are no timers and no losing.
- 1–3 ⭐ per level; finishing a level unlocks the next one.
- A 🎁 present after every level adds a sticker to his **Sticker Book** (40 to collect).
- Progress is saved on the phone.

## Put it on the iPhone

1. **Turn on GitHub Pages (one time):** in this repo go to **Settings → Pages**. Under
   *Build and deployment* pick **Deploy from a branch**, then branch **`main`** and folder **`/ (root)`**, and click **Save**.
   After a minute the game is live at **https://nadiro1985.github.io/mohameds-adventure/**
2. On the iPhone, open that link in **Safari**.
3. Tap the **Share** button ⬆️, then **Add to Home Screen** ➕, then **Add**.
4. Open **Mohamed's Adventure** from the Home Screen. 🎉

> **No sound?** Make sure the iPhone's silent switch is off and the volume is up.

## Project layout

```
index.html        page shell
css/style.css     all styles
js/app.js         screens: home, map, levels, results, sticker book
js/games.js       the mini-games
js/data.js        letters, numbers, worlds, stickers
js/sound.js       voice (speech) and sound effects
js/store.js       saved progress
sw.js             offline support (bump VERSION when files change)
manifest.json     app name and icons
```

No build step is needed. To try it on a computer, run `python3 -m http.server` in this folder and
open http://localhost:8000.
