const https = require('https');

const handleBlagueCommand = (message) => {
     const mode = message.body.split(' ')[1] || 'global'; // Récupérer le mode ou utiliser 'global' par défaut
     const validModes = ['global', 'dev'];

     if (!validModes.includes(mode)) {
          message.reply('Mode invalide. Les modes disponibles sont : global, dev');
          return;
     }

     try {
          const url = `https://blague-api.vercel.app/api?mode=${mode}`;

          https.get(url, (resp) => {
               let data = '';

               // A chunk of data has been received.
               resp.on('data', (chunk) => {
                    data += chunk;
               });

               // The whole response has been received. Print out the result.
               resp.on('end', () => {
                    const response = JSON.parse(data);
                    const blague = response.blague;
                    const reponse = response.reponse;
                    message.reply(`Blague: ${blague} \n\nRéponse: ${reponse}`);
               });

          }).on("error", (err) => {
               console.error('Erreur lors de la récupération de la blague :', err);
               message.reply('Désolé, une erreur est survenue lors de la récupération de la blague.');
          });

     } catch (error) {
          console.error('Erreur lors de la récupération de la blague :', error);
          message.reply('Désolé, une erreur est survenue lors de la récupération de la blague.');
     }
};

module.exports = handleBlagueCommand;
