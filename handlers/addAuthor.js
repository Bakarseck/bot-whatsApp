const axios = require('axios');

const handleAddAuthorCommand = async (message) => {
     const args = message.body.split(' ');

     if (args.length < 4) { // Augmenter le minimum pour accepter les noms composés
          message.reply('Veuillez fournir les informations de l\'auteur au format: #add-author "nom complet" "biographie"');
          return;
     }

     // Assurer que le nom et la biographie sont entre guillemets
     const argsJoined = message.body.slice(message.body.indexOf(' ') + 1).trim();
     const match = argsJoined.match(/^"([^"]+)"\s+"([^"]+)"$/);

     if (!match) {
          message.reply('Format invalide. Veuillez utiliser le format: #add-author "nom complet" "biographie"');
          return;
     }

     const [_, authorName, authorBiography] = match;

     try {
          const response = await axios.post('http://localhost:3000/api/auteurs', {
               nom: authorName,
               biographie: authorBiography,
          }, {
               headers: {
                    'x-api-key': process.env.API_KEY,
               },
          });

          if (response.status === 201) {
               message.reply('L\'auteur a été ajouté avec succès.');
          } else {
               message.reply('Erreur lors de l\'ajout de l\'auteur.');
          }
     } catch (error) {
          console.error('Erreur lors de l\'ajout de l\'auteur:', error);
          message.reply('Erreur lors de l\'ajout de l\'auteur. Veuillez réessayer plus tard.');
     }
};

module.exports = handleAddAuthorCommand;
