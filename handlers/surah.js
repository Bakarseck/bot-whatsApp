const axios = require('axios');
const { MessageMedia } = require('whatsapp-web.js');

const handleSurahCommand = async (message, client, to) => {
     const args = message.body.split(' ');

     if (args.length < 2 || args.length > 3) {
          message.reply(`Veuillez utiliser le format : #surah <numéro de sourate> [récitateur] \n récitateur c'est optionnel husary par défaut`);
          return;
     }

     const surahNumber = args[1];
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

     if (args.length === 3 && reciters[args[2].toLowerCase()]) {
          reciter = reciters[args[2].toLowerCase()];
     }

     try {
          const url = `https://api.alquran.cloud/v1/surah/${surahNumber}/${reciter}`;
          const response = await axios.get(url);
          const surahData = response.data.data;

          if (surahData.ayahs && surahData.ayahs.length > 0) {
               for (const ayah of surahData.ayahs) {
                    const text = ayah.text;
                    const audioUrl = ayah.audio;
                    const reply = `Ayah ${ayah.numberInSurah} :\n\n${text}\n\n`;

                    message.reply(reply);

                    const audioResponse = await axios.get(audioUrl, { responseType: 'arraybuffer' });
                    const audioBuffer = Buffer.from(audioResponse.data, 'binary').toString('base64');
                    const media = new MessageMedia('audio/mpeg', audioBuffer);

                    to ? await client.sendMessage(to, media) : await client.sendMessage(message.from, media);
               }
          } else {
               message.reply('Aucune donnée trouvée pour cette sourate.');
          }

     } catch (error) {
          console.error('Erreur lors de la récupération de la sourate :', error);
          message.reply('Désolé, une erreur est survenue lors de la récupération de la sourate.');
     }
};

module.exports = handleSurahCommand;
