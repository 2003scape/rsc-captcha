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
