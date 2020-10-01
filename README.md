# rsc-captcha
generate runescape classic sleep screen words. players would enter the generated
word during the [fatigue](https://classic.runescape.wiki/w/Fatigue) system to
continue gaining experience.

![](./captchas.gif?raw=true)

## install

    $ npm install @2003scape/rsc-captcha

## example
```javascript
const Captcha = require('./src/index');
const captcha = new Captcha();
const fs = require('fs');

(async () => {
    await captcha.loadFonts();

    for (let i = 0; i < 10; i += 1) {
        const { word, image } = captcha.generate();

        if (process.browser) {
            document.body.appendChild(new Text(word));
            document.body.appendChild(image);
            document.body.appendChild(document.createElement('br'));
        } else {
            fs.writeFileSync(`${word}.png`, image.toBuffer());
        }
    }
})();
```

## api
### Captcha.toByteArray(canvas)
convert any canvas into a game client-compatible RLE byte array.

### captcha = new Captcha(words?)
create a new captcha generator instance. words is an array of words to randomly
select from (defaults to en-uk with lengths between 4-9).

### async captcha.loadFonts()
load the main font image (`font.png`). run before generating captchas.

### captcha.generate()
generate a word and captcha associated with it. returns:

```javascript
{
    image: Canvas,
    word: String
}
```

### captcha.getWord()
pick a random word from the dictionary.

### captcha.generateImage(word)
create a Canvas with specified word.

## license
Copyright 2020  2003Scape Team

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License as published by the
Free Software Foundation, either version 3 of the License, or (at your option)
any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY
WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program. If not, see http://www.gnu.org/licenses/.
