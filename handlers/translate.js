const handleTranslateCommand = async (message) => {
     const args = message.body.split(' ');
     if (args.length < 4) {
          message.reply('Utilisation: #translate [code_langue_source] [code_langue_cible] [texte]');
          return;
     }
     const sourceLanguage = args[1];
     const targetLanguage = args[2];
     const text = args.slice(3).join(' ');

     try {
          const response = await axios.post('https://ctranslator.vercel.app/api', {
               de: sourceLanguage,
               a: targetLanguage,
               text: text
          });
          const translation = response.data.reponse;
          message.reply(`${translation}`);
     } catch (error) {
          console.error('Erreur lors de la traduction:', error);
          message.reply('Désolé, une erreur est survenue lors de la traduction.');
     }
};


module.exports = handleTranslateCommand;