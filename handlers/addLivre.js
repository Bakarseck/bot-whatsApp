const axios = require('axios');

const handleAddLivreCommand = async (message) => {
     const args = message.body.split(' ');

     if (args.length < 6) { // Augmenter le minimum pour accepter les informations nécessaires du livre
          message.reply('Veuillez fournir les informations du livre au format: #add-livre "titre" "auteur" "description" "URL de l\'image" "URL du lien"');
          return;
     }

     // Assurer que les paramètres du livre sont entre guillemets
     const argsJoined = message.body.slice(message.body.indexOf(' ') + 1).trim();
     const match = argsJoined.match(/^"([^"]+)"\s+"([^"]+)"\s+"([^"]+)"\s+"([^"]+)"\s+"([^"]+)"$/);

     if (!match) {
          message.reply('Format invalide. Veuillez utiliser le format: #add-livre "titre" "auteur" "description" "URL de l\'image" "URL du lien"');
          return;
     }

     const [_, title, author, description, imageUrl, link] = match;

     try {
          const response = await axios.post('https://islam-excellent.vercel.app/api/livres', {
               titre: title,
               auteur: author,
               description: description,
               image: imageUrl,
               link: link,
          }, {
               headers: {
                    'x-api-key': process.env.API_KEY,
               },
          });

          if (response.status === 201) {
               message.reply('Le livre a été ajouté avec succès.');
          } else {
               message.reply('Erreur lors de l\'ajout du livre.');
          }
     } catch (error) {
          console.error('Erreur lors de l\'ajout du livre:', error);
          message.reply('Erreur lors de l\'ajout du livre. Veuillez réessayer plus tard.');
     }
};

module.exports = handleAddLivreCommand;
