const { createCanvas, loadImage, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');
registerFont('NotoNaskhArabic-Regular.ttf', { family: 'Amiri' });
registerFont('Lobster-Regular.ttf', { family: 'Lobster' });


const getWrappedText = (ctx, text, maxWidth) => {
     const words = text.split(' ');
     let lines = [];
     let currentLine = words[0];

     for (let i = 1; i < words.length; i++) {
          const word = words[i];
          const width = ctx.measureText(currentLine + ' ' + word).width;
          if (width < maxWidth) {
               currentLine += ' ' + word;
          } else {
               lines.push(currentLine);
               currentLine = word;
          }
     }
     lines.push(currentLine);
     return lines;
};

const generateQuranVerseImage = async (surahNumber, ayahNumber, ayahText, translationText) => {
     const width = 500;
     const height = 800;

     const canvas = createCanvas(width, height);
     const ctx = canvas.getContext('2d');

     // Load the background image
     const backgroundImage = await loadImage(path.join(__dirname, 'cadre.jpeg'));

     // Arabic Text Image
     ctx.font = '23px Amiri';
     const maxWidth = width - 40;
     const arabicLines = getWrappedText(ctx, ayahText, maxWidth);

     ctx.font = '18px Lobster';
     const frenchLines = getWrappedText(ctx, translationText, maxWidth);

     if (arabicLines.length <= 5 && frenchLines.length <= 5) {
          // Draw the background image
          ctx.drawImage(backgroundImage, 0, 0, width, height);

          // Add the Arabic text
          ctx.font = '23px Amiri';
          ctx.textAlign = 'center';
          ctx.fillStyle = 'black';
          ctx.textBaseline = 'top';
          arabicLines.forEach((line, index) => {
               ctx.fillText(line, width / 2, 250 + (index * 40));
          });

          // Add the reference in French
          ctx.font = '35px Lobster';
          ctx.textAlign = 'right';
          ctx.fillText(`Sourate ${surahNumber}, Ayah ${ayahNumber}`, width - 100, 160);

          // Add the French text
          ctx.font = '18px Lobster';
          ctx.textAlign = 'center';
          frenchLines.forEach((line, index) => {
               ctx.fillText(line, width / 2, 430 + (index * 24));
          });

          const buffer = canvas.toBuffer('image/png');
          const arabicImagePath = path.join(__dirname, 'quran-verse.png');
          fs.writeFileSync(arabicImagePath, buffer);
          return { arabicImagePath };

     } else {
          // Generate separate Arabic image
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(backgroundImage, 0, 0, width, height);

          ctx.font = '30px Amiri';
          ctx.textAlign = 'center';
          ctx.fillStyle = 'black';
          ctx.fillText(`سورة ${surahNumber}, آية ${ayahNumber}`, width / 2, 190);

          ctx.font = '23px Amiri';
          ctx.fillStyle = 'black';
          ctx.textBaseline = 'top';
          arabicLines.forEach((line, index) => {
               ctx.fillText(line, width / 2, 250 + (index * 40));
          });

          const arabicBuffer = canvas.toBuffer('image/png');
          const arabicImagePath = path.join(__dirname, 'quran-verse-arabic.png');
          fs.writeFileSync(arabicImagePath, arabicBuffer);

          // Generate separate French image
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(backgroundImage, 0, 0, width, height);

          ctx.font = '35px Lobster';
          ctx.textAlign = 'right';
          ctx.fillStyle = 'black';
          ctx.fillText(`Sourate ${surahNumber}, Ayah ${ayahNumber}`, width - 100, 160);

          ctx.font = '18px Lobster';
          ctx.fillStyle = 'black';
          ctx.textAlign = 'center';
          frenchLines.forEach((line, index) => {
               ctx.fillText(line, width / 2, 300 + (index * 24));
          });

          const frenchBuffer = canvas.toBuffer('image/png');
          const frenchImagePath = path.join(__dirname, 'quran-verse-french.png');
          fs.writeFileSync(frenchImagePath, frenchBuffer);

          return { arabicImagePath, frenchImagePath };
     }
};

module.exports = { generateQuranVerseImage };