// // Vérifier si le message provient d'un statut
// if (message.from.includes('status')) {

//      // Enregistrer le statut
//      if (message.hasMedia) {
//           try {
//                const media = await message.downloadMedia();
//                if (media && media.mimetype) {
//                     const mediaExtension = media.mimetype.split('/')[1];
//                     const filePath = path.join(__dirname, `status-files/${message.id.id}.${mediaExtension}`);
//                     fs.writeFile(filePath, media.data, 'base64', (err) => {
//                          if (err) {
//                               console.error('Erreur lors de la sauvegarde du statut :', err);
//                          } else {
//                               console.log(`Statut enregistré : ${filePath}`);
//                          }
//                     });
//                } else {
//                     console.error('Le média téléchargé n\'a pas de type MIME ou est invalide.');
//                }
//           } catch (err) {
//                console.error('Erreur lors du téléchargement du média du statut :', err);
//           }
//      } else {
//           console.log('Le statut ne contient pas de média.');
//      }
// }

// // Fonctionnalité pour enregistrer les fichiers médias reçus, y compris les PDF
// if (message.hasMedia) {
//      try {
//           const media = await message.downloadMedia();
//           if (media && media.mimetype) {
//                const mediaExtension = media.mimetype.split('/')[1];
//                const filePath = path.join(__dirname, `received-files/${message.id.id}.${mediaExtension}`);
//                fs.writeFile(filePath, media.data, 'base64', (err) => {
//                     if (err) {
//                          console.error(`Erreur lors de la sauvegarde du fichier média (${media.mimetype}) :`, err);
//                     } else {
//                          console.log(`Fichier média enregistré : ${filePath}`);
//                     }
//                });
//           } else {
//                console.error('Le média téléchargé n\'a pas de type MIME ou est invalide.');
//           }
//      } catch (err) {
//           console.error('Erreur lors du téléchargement du média :', err);
//      }
// }