const Captcha = require('./src/index');
const captcha = new Captcha();
const fs = require('fs');

function blobToBase64(blob) {
    const reader = new FileReader();
    reader.readAsDataURL(blob);

    return new Promise((resolve) => {
        reader.onloadend = () => {
            resolve(reader.result);
        };
    });
}

(async () => {
    await captcha.loadFonts();

    for (let i = 0; i < 10; i += 1) {
        const { word, image } = captcha.generate();

        if (process.browser) {
            document.body.appendChild(new Text(word));

            if (image.constructor.name === 'OffscreenCanvas') {
                const img = document.createElement('img');
                img.src = `${await blobToBase64(await image.convertToBlob())}`;
                document.body.appendChild(img);
            } else {
                document.body.appendChild(image);
            }

            document.body.appendChild(document.createElement('br'));
        } else {
            fs.writeFileSync(`${word}.png`, image.toBuffer());
        }
    }
})();
