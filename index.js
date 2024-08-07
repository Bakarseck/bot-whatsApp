require('dotenv').config();

const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const https = require('https');
const readline = require('readline');
const schedule = require('node-schedule');

const handleWikipediaCommand = require('./handlers/wikipedia');
const handleQuranCommand = require('./handlers/ayah');
const handleSurahCommand = require('./handlers/surah');
const handleSearchCommand = require('./handlers/search');
const handleAddPrayerCommand = require('./handlers/add');
const handleTranslateCommand = require('./handlers/translate');
const handleWeatherCommand = require('./handlers/weather');
const handleGPTCommand = require('./handlers/gpt');
const handleAddAuthorCommand = require('./handlers/addAuthor');
const handleAddLivreCommand = require('./handlers/addLivre');

const { sendReminder, scheduleReminder } = require('./handlers/reminder');

const { surnoms, hadiths } = require('./utils');

const client = new Client({
     authStrategy: new LocalAuth()
});

client.on('qr', (qr) => {
     qrcode.generate(qr, { small: true });
     console.log('QR code généré, scannez-le avec votre téléphone.');
});

client.on('loading_screen', (percent, message) => {
     const width = 40; // Width of the progress bar
     const completed = Math.round((percent / 100) * width);
     const incomplete = width - completed;
     const progressBar = `[${'='.repeat(completed)}${' '.repeat(incomplete)}] ${percent}%`;

     readline.cursorTo(process.stdout, 0);
     process.stdout.write(`${message}: ${progressBar}`);
});

// Connexion réussie
client.on('ready', () => {
     console.log('\nLe client est prêt.');

     sendReminder(client);
     setInterval(() => {
          sendReminder(client);
     }, 24 * 60 * 60 * 1000);
});

client.on('message_create', async (message) => {
     // Fired on all message creations, including your own
     if (message.fromMe) {

          if (message.body.toLocaleLowerCase().startsWith('#add-livre')) {
               await handleAddLivreCommand(message);
          }

          if (message.body.toLocaleLowerCase().startsWith('#add-author')) {
               await handleAddAuthorCommand(message);
          }

          if (message.body.toLocaleLowerCase().startsWith('#surah')) {
               await handleSurahCommand(message, client, message.to);
          }

          if (message.body.toLocaleLowerCase() === '#help') {
               const helpMessage = `
  Voici la liste des commandes disponibles :
  
  1. *#wiki [sujet]* - Recherche des informations sur Wikipedia sur un sujet donné.
  2. *#quran surah [numéro de sourate]* - Envoie un fichier audio de la sourate spécifiée.
  3. *#weather [localisation]* - Donne la météo actuelle pour la localisation spécifiée.
  4. *#translate [texte]* - Traduit le texte spécifié.
  5. *#add-prayer [prière]* - Ajoute une prière à la liste.
  6. *#rappel [heure:minute]* - Programme un rappel à l'heure spécifiée.
  7. *#status [statut]* - Met à jour le statut du profil WhatsApp.
  8. *#search [requête]* - Effectue une recherche sur le web.
  9. *#imagine [description]* - Génère et envoie une image basée sur la description donnée.
  10. *#hadith* - Envoie un hadith aléatoire parmi une liste préenregistrée.
  11. *#surnom* - Envoie un surnom affectueux en arabe avec sa translittération et sa signification.
  12. *#blague [mode]* - Envoie une blague basée sur le mode spécifié (global ou dev).
  13. *#tagall* - Tag tous les membres d'un groupe.
  14. *#gpt [message]* - Obtenez une réponse de l'IA GPT-3.5-turbo.
          `;
               message.reply(helpMessage);
          }

          if (message.body.toLocaleLowerCase().startsWith('#weather')) {
               await handleWeatherCommand(message);
          }

          if (message.body.toLocaleLowerCase().startsWith('#translate')) {
               await handleTranslateCommand(message);
          }

          if (message.body.toLocaleLowerCase().startsWith('#add-prayer')) {
               await handleAddPrayerCommand(message);
          }


          if (message.body.toLocaleLowerCase().startsWith('#quran')) {
               await handleQuranCommand(message, client, message.to);
          }

          if (message.body.toLocaleLowerCase().startsWith('#search')) {
               await handleSearchCommand(message, client, message.to);
          }

          if (message.body.toLocaleLowerCase().startsWith('#rappel') && message.fromMe) {
               const parts = message.body.substring(8).trim().split(' ');
               const timePart = parts[0];
               const dayPart = parts[1] && isNaN(parts[1]) ? parts[1] : null;
               const reminderMessage = parts.slice(dayPart ? 2 : 1).join(' ') || 'Ceci est votre rappel programmé.';

               const [hour, minute] = timePart.split(':');
               const daysOfWeek = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
               const dayIndex = dayPart ? daysOfWeek.indexOf(dayPart.toLowerCase()) : null;

               if (!isNaN(hour) && !isNaN(minute) && (dayPart === null || dayIndex !== -1)) {
                    let scheduleRule;

                    if (dayPart) {
                         scheduleRule = { hour: parseInt(hour), minute: parseInt(minute), dayOfWeek: dayIndex };
                    } else {
                         scheduleRule = { hour: parseInt(hour), minute: parseInt(minute) };
                    }

                    schedule.scheduleJob(scheduleRule, () => {
                         message.reply(reminderMessage);
                    });

                    if (dayPart) {
                         message.reply(`Rappel programmé pour ${daysOfWeek[dayIndex]} à ${hour}:${minute} avec le message : "${reminderMessage}".`);
                    } else {
                         message.reply(`Rappel programmé pour ${hour}:${minute} avec le message : "${reminderMessage}".`);
                    }
               } else {
                    message.reply('Veuillez utiliser le format : #rappel [heure:minute] [jour optionnel] [message optionnel]. Ex: #rappel 14:30 lundi N\'oubliez pas de prendre votre médicament.');
               }
          }

          if (message.body.startsWith('#status')) {
               const newStatus = message.body.substring(8).trim();
               await client.setStatus(newStatus);
               message.reply(`Le statut a été mis à jour à : *${newStatus}*`);
          }

          if (message.body.toLocaleLowerCase().startsWith('#blague')) {
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
          }

          if (message.body.toLocaleLowerCase().startsWith('#wiki')) {
               await handleWikipediaCommand(message);
          }

          if (message.body.toLocaleLowerCase().startsWith('#gpt')) {
               await handleGPTCommand(message, client, message.to);
          }
     }
});

// Réception de messages
client.on('message', async message => {

     if (message.from === '120363048779498866@g.us') {
          return;
     }

     if (message.body.toLocaleLowerCase().startsWith('#rappel')) {
          const parts = message.body.substring(8).trim().split(' ');
          const timePart = parts[0];
          const dayPart = parts[1] && isNaN(parts[1]) ? parts[1] : null;
          const reminderMessage = parts.slice(dayPart ? 2 : 1).join(' ') || 'Ceci est votre rappel programmé.';

          const [hour, minute] = timePart.split(':');
          const daysOfWeek = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
          const dayIndex = dayPart ? daysOfWeek.indexOf(dayPart.toLowerCase()) : null;

          if (!isNaN(hour) && !isNaN(minute) && (dayPart === null || dayIndex !== -1)) {
               let scheduleRule;

               if (dayPart) {
                    scheduleRule = { hour: parseInt(hour), minute: parseInt(minute), dayOfWeek: dayIndex };
               } else {
                    scheduleRule = { hour: parseInt(hour), minute: parseInt(minute) };
               }

               schedule.scheduleJob(scheduleRule, () => {
                    message.reply(reminderMessage);
               });

               if (dayPart) {
                    message.reply(`Rappel programmé pour ${daysOfWeek[dayIndex]} à ${hour}:${minute} avec le message : "${reminderMessage}".`);
               } else {
                    message.reply(`Rappel programmé pour ${hour}:${minute} avec le message : "${reminderMessage}".`);
               }
          } else {
               message.reply('Veuillez utiliser le format : #rappel [heure:minute] [jour optionnel] [message optionnel]. Ex: #rappel 14:30 lundi N\'oubliez pas de prendre votre médicament.');
          }
     }

     if (message.body.toLocaleLowerCase().startsWith('#weather')) {
          await handleWeatherCommand(message);
     }

     if (message.body.toLocaleLowerCase().startsWith('#translate')) {
          await handleTranslateCommand(message);
     }

     if (message.body.toLocaleLowerCase().startsWith('#surah')) {
          await handleSurahCommand(message, client);
     }

     if (message.body.toLocaleLowerCase().startsWith('#search')) {
          await handleSearchCommand(message, client);
     }

     if (message.body.toLocaleLowerCase().startsWith('#rappel')) {
          const time = message.body.substring(8).trim();
          const [hour, minute] = time.split(':');
          if (!isNaN(hour) && !isNaN(minute)) {
               // scheduleReminder(client, hour, minute);
               schedule.scheduleJob(`${minute} ${hour} * * *`, () => {
                    message.reply('Ceci est votre rappel programmé.');
               });
               message.reply(`Rappel programmé pour ${hour}:${minute}.`);
          } else {
               message.reply('Veuillez utiliser le format : #rappel [heure:minute].');
          }
     }

     if (message.body.toLocaleLowerCase().startsWith('#imagine')) {
          const prompt = message.body.substring(9).trim();
          await generateImage(prompt, message);
     }

     if (message.body.toLocaleLowerCase().startsWith('#gpt')) {
          await handleGPTCommand(message, client);
     }

     if (message.body.toLocaleLowerCase() === '#help') {
          const helpMessage = `
  Voici la liste des commandes disponibles :
  
  1. *#wiki [sujet]* - Recherche des informations sur Wikipedia sur un sujet donné.
  2. *#quran surah [numéro de sourate]* - Envoie un fichier audio de la sourate spécifiée.
  3. *#weather [localisation]* - Donne la météo actuelle pour la localisation spécifiée.
  4. *#translate [texte]* - Traduit le texte spécifié.
  5. *#add-prayer [prière]* - Ajoute une prière à la liste.
  6. *#rappel [heure:minute]* - Programme un rappel à l'heure spécifiée.
  7. *#status [statut]* - Met à jour le statut du profil WhatsApp.
  8. *#search [requête]* - Effectue une recherche sur le web.
  9. *#imagine [description]* - Génère et envoie une image basée sur la description donnée.
  10. *#hadith* - Envoie un hadith aléatoire parmi une liste préenregistrée.
  11. *#surnom* - Envoie un surnom affectueux en arabe avec sa translittération et sa signification.
  12. *#blague [mode]* - Envoie une blague basée sur le mode spécifié (global ou dev).
  13. *#tagall* - Tag tous les membres d'un groupe.
  14. *#gpt [message]* - Obtenez une réponse de l'IA GPT-3.5-turbo.
          `;
          message.reply(helpMessage);
     }

     if (message.body.toLocaleLowerCase().startsWith('#wiki')) {
          await handleWikipediaCommand(message);
     }

     if (message.body.toLocaleLowerCase().startsWith('#quran')) {
          await handleQuranCommand(message, client);
     }

     if (message.body.toLocaleLowerCase().startsWith('#image')) {
          const prompt = message.body.substring(7).trim();
          const apiToken = 'CTAPI-283AXEaUHGoWpClBBNINsOGwFI';

          try {
               const url = `https://imageai.codingteamapi.workers.dev/?gen=${prompt}&token=${apiToken}`;

               const options = {
                    timeout: 30000 // 30 secondes de délai d'attente
               };

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

                              client.sendMessage(message.from, media);
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
     }

     if (message.body.includes('#hadith')) {
          const randomHadith = hadiths[Math.floor(Math.random() * hadiths.length)];
          message.reply(randomHadith);
     }


     if (message.body.includes('#surnom')) {
          const randomSurnom = surnoms[Math.floor(Math.random() * surnoms.length)];
          const replyMessage = `${randomSurnom.arabe} (${randomSurnom.transliteration}) - Signifie "${randomSurnom.signification}".`;
          message.reply(replyMessage);
     }


     if (message.body.toLocaleLowerCase().startsWith('#blague')) {
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
     }

     if (message.body.toLowerCase() === '#tagall') {
          console.log("Commande #tagall détectée provenant de vous");
          const chat = await message.getChat();

          if (message.from === '120363048779498866@g.us') {
               return;
          }

          console.log(`Chat is group: ${chat.isGroup}`);
          if (chat.isGroup) {
               let mentions = [];
               let text = '══✪〘   Tag All   〙✪══\n\n➲ Message : blank Message\n';

               for (let participant of chat.participants) {
                    console.log(`Participant ID: ${participant.id._serialized}`);
                    const contact = await client.getContactById(participant.id._serialized);
                    console.log(`Contact: ${contact.pushname || contact.number}`);
                    mentions.push(contact);
                    text += `@${contact.number}\n`;
               }

               console.log(`Mentions: ${mentions.map(c => c.id._serialized).join(', ')}`);
               chat.sendMessage(text, { mentions }).then(response => {
                    console.log('Message envoyé avec les mentions.');
               }).catch(err => {
                    console.error('Erreur lors de l\'envoi du message avec mentions :', err);
               });
          } else {
               console.log('Le message n\'a pas été envoyé car ce n\'est pas un groupe.');
          }
     }
});

// Initialiser le client
client.initialize();
