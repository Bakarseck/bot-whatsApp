const https = require('https');
const { MessageMedia } = require('whatsapp-web.js');

const generateImage = async (prompt, message, client) => {
     const apiToken = 'CTAPI-283AXEaUHGoWpClBBNINsOGwFI';
     const url = `https://imageai.codingteamapi.workers.dev/?gen=${prompt}&token=${apiToken}`;

     const options = {
          timeout: 30000
     };

     try {
          https.get(url, options, (resp) => {
               let data = [];

               resp.on('data', (chunk) => {
                    data.push(chunk);
               });

               resp.on('end', async () => {
                    try {
                         // Join the chunks to form the complete image buffer
                         const imageBuffer = Buffer.concat(data);
                         const media = new MessageMedia('image/png', imageBuffer.toString('base64'));

                         await client.sendMessage(message.from, media);
                    } catch (e) {
                         console.error('Erreur lors de la génération de l\'image :', e);
                         message.reply('Désolé, une erreur est survenue lors de la génération de l\'image.');
                    }
               });

          }).on("error", (err) => {
               console.error('Erreur lors de la génération de l\'image :', err);
               message.reply('Désolé, une erreur est survenue lors de la génération de l\'image.');
          }).setTimeout(options.timeout, () => {
               message.reply('Délai d\'attente dépassé pour la génération de l\'image.');
          });
     } catch (error) {
          console.error('Erreur lors de la génération de l\'image :', error);
          message.reply('Désolé, une erreur est survenue lors de la génération de l\'image.');
     }
};

module.exports = generateImage;
