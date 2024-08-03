axios = require('axios');
const { MessageMedia } = require('whatsapp-web.js');


const handleSearchCommand = async (message, client, to) => {
     const args = message.body.split(' ');

     if (args.length < 2) {
          message.reply('Veuillez fournir un mot-clé pour la recherche. Exemple : #search يا أيها الذين آمنوا');
          return;
     }

     const keyword = args.slice(1).join(' ');
     const surah = 'all';
     const edition = 'ar';

     console.log('keyword: ', keyword, surah, edition)

     const url = `https://api.alquran.cloud/v1/search/${encodeURIComponent(keyword)}/${surah}/${edition}`;

     try {
          const response = await axios.get(url);
          const results = response.data.data.matches;

          if (results.length === 0) {
               message.reply('Aucun résultat trouvé.');
               return;
          }

          await displayResults(results, message, keyword, client, to);

     } catch (error) {
          console.error('Erreur lors de la recherche:', error);
          message.reply('Erreur lors de la recherche. Veuillez réessayer plus tard.');
     }
};

const displayResults = async (results, message, keyword, client, to) => {
     for (const result of results) {
          if (result.edition.type === 'quran') {
               const ayahNumber = result.numberInSurah;
               const surahNumber = result.surah.number;

               // Récupérer la traduction
               const translationUrl = `http://api.alquran.cloud/v1/ayah/${surahNumber}:${ayahNumber}/fr.hamidullah`;
               const translationResponse = await axios.get(translationUrl);
               const translation = translationResponse.data.data.text;


               // Récupérer l'audio
               const audioUrl = `http://api.alquran.cloud/v1/ayah/${surahNumber}:${ayahNumber}/ar.husary`;
               const _audioResponse = await axios.get(audioUrl);
               const audio = _audioResponse.data.data.audio;

               const quranText = _audioResponse.data.data.text;

               const reply = `Résultats pour "${keyword}":\n\nSourate ${surahNumber}, Ayah ${ayahNumber}:\n\n\n ${quranText}\n\n\n ${translation}`;

               await message.reply(reply);

               const audioResponse = await axios.get(audio, { responseType: 'arraybuffer' });
               const audioBuffer = Buffer.from(audioResponse.data, 'binary').toString('base64');
               const media = new MessageMedia('audio/mpeg', audioBuffer);

               to ? client.sendMessage(to, media) : client.sendMessage(message.from, media)
          }
     }
};

module.exports = handleSearchCommand;