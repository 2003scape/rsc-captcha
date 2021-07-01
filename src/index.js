const Image =
    typeof window !== 'undefined' ? window.Image : require('canvas').Image;

const fs = require('fs');
const enUKWords = require('../en-uk');
let { createCanvas } = require('canvas');

if (typeof OffscreenCanvas !== 'undefined') {
    createCanvas = function (width, height) {
        return new OffscreenCanvas(width, height);
    };
}

const FONT_IMAGE = fs
    .readFileSync(__dirname + '/../fonts.png')
    .toString('base64');

const CHAR_WIDTH = 48;
const CHAR_HEIGHT = 40;

const CAPTCHA_WIDTH = 255;

class Captcha {
    constructor(words = enUKWords) {
        this.words = words;
        this.charImages = {}; // { 'a': [Canvas, Canvas, ...] }
    }

    loadImageData() {
        const canvas = createCanvas(
            this.fontImage.width,
            this.fontImage.height
        );

        const context = canvas.getContext('2d');
        context.drawImage(this.fontImage, 0, 0);

        this.fontImageData = context.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
        );
    }

    getCharBounds(x, y) {
        let minX = 0;
        let maxX = 0;
        let minY = 0;
        let maxY = 0;

        let empty = true;

        for (let i = y; i < y + CHAR_HEIGHT; i += 1) {
            for (let j = x; j < x + CHAR_WIDTH; j += 1) {
                const index = 4 * (j + i * this.fontImage.width);

                if (this.fontImageData.data[index] !== 0) {
                    empty = false;

                    if (maxX === 0 || j < minX) {
                        minX = j;
                    }

                    if (j > maxX) {
                        maxX = j;
                    }

                    if (maxY === 0) {
                        minY = i;
                    }

                    if (i > maxY) {
                        maxY = i;
                    }
                }
            }
        }

        if (empty) {
            return null;
        }

        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }

    async loadFonts() {
        await new Promise((resolve, reject) => {
            if (typeof createImageBitmap !== 'undefined') {
                fetch(`data:image/png;base64,${FONT_IMAGE}`)
                    .then((res) => res.blob())
                    .then((blob) => createImageBitmap(blob))
                    .then((image) => {
                        this.fontImage = image;
                        resolve();
                    })
                    .catch(reject);
            } else {
                this.fontImage = new Image();
                this.fontImage.onerror = reject;
                this.fontImage.onload = resolve;
                this.fontImage.src = `data:image/png;base64,${FONT_IMAGE}`;
            }
        });

        this.loadImageData();

        const maxChars = Math.floor(this.fontImage.width / CHAR_WIDTH);

        for (let i = 0; i < 26; i += 1) {
            this.charImages[String.fromCharCode(97 + i)] = [];

            for (let j = 0; j < maxChars; j += 1) {
                const x = j * CHAR_WIDTH;
                const y = i * CHAR_HEIGHT;

                const boundaries = this.getCharBounds(x, y);

                if (!boundaries) {
                    continue;
                }

                const canvas = createCanvas(
                    boundaries.width,
                    boundaries.height
                );

                const context = canvas.getContext('2d');

                context.putImageData(
                    this.fontImageData,
                    -boundaries.x,
                    -boundaries.y,
                    boundaries.x,
                    boundaries.y,
                    boundaries.width,
                    boundaries.height
                );

                this.charImages[String.fromCharCode(97 + i)].push(canvas);
            }
        }
    }

    getCharImage(character) {
        character = character.toLowerCase();
        const charImages = this.charImages[character];

        if (!charImages) {
            return;
        }

        return charImages[Math.floor(Math.random() * charImages.length)];
    }

    getWord() {
        return this.words[Math.floor(Math.random() * this.words.length)];
    }

    generateImage(word) {
        let x = 0;
        let y = 0;

        const canvas = createCanvas(CAPTCHA_WIDTH, CHAR_HEIGHT);
        const context = canvas.getContext('2d');

        context.fillStyle = '#000';
        context.fillRect(0, 0, canvas.width, canvas.height);

        for (const character of word) {
            const charImage = this.getCharImage(character);

            if (!charImage) {
                break;
            }

            x += Math.floor(Math.random() * 12);
            y = canvas.height / 2 - Math.floor(charImage.height / 2) - 6;
            y += Math.floor(Math.random() * 12);
            context.drawImage(charImage, x, y);
            x += charImage.width;
        }

        return canvas;
    }

    generate() {
        const word = this.getWord();
        const image = this.generateImage(word);
        return { word, image };
    }

    static toByteArray(canvas) {
        const encoded = [];
        const context = canvas.getContext('2d');
        const imageData = context.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
        ).data;

        let x = 0;
        let y = 0;
        let colour = 0;
        let length = 0;

        for (; x < canvas.width; ) {
            const index = 4 * (x + y * canvas.width);

            if (imageData[index] === colour) {
                length += 1;
            } else {
                encoded.push(length);
                length = 1;
                colour = 255 - colour;
            }

            x += 1;
        }

        encoded.push(length);

        for (y = 1; y < canvas.height; y += 1) {
            length = 0;

            for (x = 0; x < canvas.width; x += 1) {
                const lastRowIndex = 4 * ((y - 1) * canvas.width + x);
                const index = 4 * (y * canvas.width + x);

                if (imageData[index] === imageData[lastRowIndex]) {
                    length += 1;
                } else {
                    encoded.push(length);
                    length = 0;
                }
            }

            encoded.push(length);
        }

        return new Uint8Array(encoded);
    }
}

module.exports = Captcha;
