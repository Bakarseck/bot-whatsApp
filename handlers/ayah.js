const axios = require('axios');
const { MessageMedia } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage, registerFont } = require('canvas');
const PDFDocument = require('pdfkit');

registerFont('NotoNaskhArabic-Regular.ttf', { family: 'Amiri' });
registerFont('Lobster-Regular.ttf', { family: 'Lobster' });

const generateQuranVerseImage = async (surahNumber, ayahNumber, ayahText, translationText) => {
     const width = 500;
     const height = 800;

     const canvas = createCanvas(width, height);
     const ctx = canvas.getContext('2d');

     // Load the background image
     const backgroundImage = await loadImage(path.join(__dirname, 'cadre.jpeg'));
     ctx.drawImage(backgroundImage, 0, 0, width, height);

     // Arabic Text Image

     // Add the reference in Arabic
     ctx.font = '30px Amiri';
     ctx.textAlign = 'center';
     ctx.fillStyle = 'black';
     ctx.fillText(`سورة ${surahNumber}, آية ${ayahNumber}`, width - 250, 190);

     ctx.font = '23px Amiri';
     ctx.fillStyle = 'black';
     ctx.textBaseline = 'top';

     const maxWidth = width - 40;
     const lineHeight = 40;
     const arabicLines = getWrappedText(ctx, ayahText, maxWidth);
     arabicLines.forEach((line, index) => {
          if (arabicLines.length < 6) {
               ctx.fillText(line, width / 2, 300 + (index * lineHeight));
          } else {
               ctx.fillText(line, width / 2, 230 + (index * lineHeight));
          }
     });

     const arabicBuffer = canvas.toBuffer('image/png');
     const arabicImagePath = path.join(__dirname, 'quran-verse-arabic.png');
     fs.writeFileSync(arabicImagePath, arabicBuffer);

     // Clear the canvas
     ctx.clearRect(0, 0, canvas.width, canvas.height);
     ctx.drawImage(backgroundImage, 0, 0, width, height);

     // Add the reference in French
     ctx.font = '35px Lobster';
     ctx.fillStyle = 'black';
     ctx.textAlign = 'right';
     ctx.fillText(`Sourate ${surahNumber}, Ayah ${ayahNumber}`, width - 150, 160);

     // French Text Image
     ctx.font = '15px Lobster';
     ctx.fillStyle = 'black';
     ctx.textAlign = 'center';
     const frenchLines = getWrappedText(ctx, translationText, maxWidth);
     frenchLines.forEach((line, index) => {
          if (frenchLines.length < 6) {
               ctx.fillText(line, width / 2, 300 + (index * 24));
          } else {
               ctx.fillText(line, width / 2, 230 + (index * 24));
          }
     });

     const frenchBuffer = canvas.toBuffer('image/png');
     const frenchImagePath = path.join(__dirname, 'quran-verse-french.png');
     fs.writeFileSync(frenchImagePath, frenchBuffer);

     return { arabicImagePath, frenchImagePath };
};

const getWrappedText = (ctx, text, maxWidth) => {
     const words = text.split(' ');
     let lines = [];
     let currentLine = words[0];

     for (let i = 1; i < words.length; i++) {
          const word = words[i];
          const width = ctx.measureText(currentLine + " " + word).width;
          if (width < maxWidth) {
               currentLine += " " + word;
          } else {
               lines.push(currentLine);
               currentLine = word;
          }
     }
     lines.push(currentLine);
     return lines;
};

const handleQuranCommand = async (message, client, to) => {
     const args = message.body.split(' ');

     if (args.length === 2 && args[1].toLowerCase() === "usage") {
          message.reply('Utilisation: #quran [numéro de sourate] [numéro de verset] [récitateur] \n\nou #quran simplement pour un verset aléatoire\n\nExemples de récitateurs: alafasy, abdulsamad, husary, maher, leclerc, sudais, muyassar, shaikhsudais, minshawi, ayyub, rifai');
          return;
     }

     try {
          let urlText, urlAudio;
          const reciters = {
               'alafasy': 'ar.alafasy',
               'abdulsamad': 'ar.abdulsamad',
               'husary': 'ar.husary',
               'maher': 'ar.mahermuaiqly',
               'sudais': 'ar.abdurrahmaansudais',
               'leclerc': 'fr.leclerc',
               'muyassar': 'ar.muyassar',
               'shaikhsudais': 'ar.abdurrahmaansudais',
               'minshawi': 'ar.minshawi',
               'ayyub': 'ar.muhammadayyoub',
               'rifai': 'ar.hanirifai'
          };
          let reciter = 'ar.husary';

          if (args.length === 1 || (args.length === 2 && isNaN(args[1]))) {
               // Get a random verse
               console.log('Getting a random verse');
               const randomAyahNumber = Math.floor(Math.random() * 6236) + 1;
               if (args.length === 2 && reciters[args[1].toLowerCase()]) {
                    reciter = reciters[args[1].toLowerCase()];
               }
               urlText = `https://api.alquran.cloud/v1/ayah/${randomAyahNumber}/editions/quran-simple,fr.hamidullah`;
               urlAudio = `https://api.alquran.cloud/v1/ayah/${randomAyahNumber}/${reciter}`;
          } else if (args.length === 2 && !isNaN(args[1])) {
               // Whole Surah
               const surahNumber = args[1];
               urlText = `https://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-simple,fr.hamidullah`;

               const responseText = await axios.get(urlText, { timeout: 120000 });
               const dataText = responseText.data.data;

               const pdfPath = await generateQuranSurahPDF(dataText[0], dataText[1]);

               // Send the PDF via WhatsApp
               console.log('Sending the PDF via WhatsApp');
               const pdfMedia = MessageMedia.fromFilePath(pdfPath);
               to ? await client.sendMessage(to, pdfMedia) : await client.sendMessage(message.from, pdfMedia);
               return; // Exit early after sending the whole Surah
          } else if (args.length >= 3 && !isNaN(args[1]) && !isNaN(args[2])) {
               // Get a specific verse
               const surah = args[1];
               const ayah = args[2];

               if (args.length === 4 && reciters[args[3].toLowerCase()]) {
                    reciter = reciters[args[3].toLowerCase()];
               }

               urlText = `https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/editions/quran-simple,fr.hamidullah`;
               urlAudio = `https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/${reciter}`;
          } else {
               message.reply('Veuillez utiliser le format : #quran <numéro de sourate> <numéro de verset> [récitateur]');
               return;
          }

          const [responseText, responseAudio] = await Promise.all([
               axios.get(urlText, { timeout: 120000 }),  // Increased timeout to 120 seconds
               axios.get(urlAudio, { timeout: 120000 })  // Increased timeout to 120 seconds
          ]);

          const dataText = responseText.data.data;
          const dataAudio = responseAudio.data.data;

          const quranText = dataText[0].text;
          const translation = dataText[1].text;

          const { arabicImagePath, frenchImagePath } = await generateQuranVerseImage(dataAudio.surah.number, dataAudio.numberInSurah, quranText, translation);

          // Send the Arabic text image via WhatsApp
          const arabicMedia = MessageMedia.fromFilePath(arabicImagePath);
          to ? await client.sendMessage(to, arabicMedia) : await client.sendMessage(message.from, arabicMedia);

          // Send the French text image via WhatsApp
          const frenchMedia = MessageMedia.fromFilePath(frenchImagePath);
          to ? await client.sendMessage(to, frenchMedia) : await client.sendMessage(message.from, frenchMedia);

          // Send the audio via WhatsApp
          const audioUrl = dataAudio.audio;
          const audioResponse = await axios.get(audioUrl, { responseType: 'arraybuffer' });
          const audioBuffer = Buffer.from(audioResponse.data, 'binary');
          const audioMedia = new MessageMedia('audio/mpeg', audioBuffer.toString('base64'), 'quran-audio.mp3');
          to ? await client.sendMessage(to, audioMedia) : await client.sendMessage(message.from, audioMedia);

     } catch (error) {
          console.error('Erreur lors de la récupération du verset du Quran :', error);
          message.reply('Désolé, une erreur est survenue lors de la récupération du verset.');
     }
};

const generateQuranSurahPDF = async (surahData, translationData) => {
     return new Promise((resolve, reject) => {
          const doc = new PDFDocument();
          const pdfPath = './quran_surah.pdf';
          const writeStream = fs.createWriteStream(pdfPath);
          doc.pipe(writeStream);

          // Ajouter le texte arabe complet
          doc.font('NotoNaskhArabic-Regular.ttf').fontSize(14);
          surahData.ayahs.forEach((ayah, index) => {
               doc.text(ayah.text, { align: 'left' });
               doc.addPage();
          });


          // doc.font('Arial.ttf').fontSize(14).text(translationData.ayahs[index].text, { align: 'left' });
          doc.end();
          writeStream.on('finish', () => {
               resolve(pdfPath);
          });
          writeStream.on('error', (error) => {
               reject(error);
          });
     });
};

module.exports = handleQuranCommand;
