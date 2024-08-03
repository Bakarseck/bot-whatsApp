const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const https = require('https');
const axios = require('axios');
const schedule = require('node-schedule');

const handleWikipediaCommand = require('./handlers/wikipedia');
const handleQuranCommand = require('./handlers/ayah');
const handleSurahCommand = require('./handlers/surah');
const handleSearchCommand = require('./handlers/search');
const handleAddPrayerCommand = require('./handlers/add');
const { sendReminder, scheduleReminder } = require('./handlers/reminder');

const { surnoms, hadiths, trackedContacts } = require('./utils');

const myId = '221762773266@c.us';

const client = new Client({
     authStrategy: new LocalAuth()
});

client.on('qr', (qr) => {
     qrcode.generate(qr, { small: true });
     console.log('QR code généré, scannez-le avec votre téléphone.');
});

client.on('loading_screen', (percent, message) => {
     console.log('LOADING SCREEN', percent, message);
});

client.on('message_ack', (msg, ack) => {
     /*
         == ACK VALUES ==
         ACK_ERROR: -1
         ACK_PENDING: 0
         ACK_SERVER: 1
         ACK_DEVICE: 2
         ACK_READ: 3
         ACK_PLAYED: 4
     */

     // Vérifiez si le message provient ou est destiné à un des contacts suivis
     if (trackedContacts.includes(msg.from) || trackedContacts.includes(msg.to)) {
          if (ack === 3) {
               console.log(`Message lu par ${msg.to}`);
               client.sendMessage(msg.from, `Votre message a été lu par ${msg.to}`);
          }
     }
});


// Connexion réussie
client.on('ready', () => {
     console.log('Le client est prêt.');

     sendReminder(client);
     setInterval(() => {
          sendReminder(client);
     }, 24 * 60 * 60 * 1000);
});

client.on('message_create', async (message) => {
     // Fired on all message creations, including your own
     if (message.fromMe) {
          if (message.body.toLocaleLowerCase().startsWith('#surah')) {
               await handleSurahCommand(message, client, message.to);
          }
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

     // if (message.body.toLocaleLowerCase().startsWith('#imagine')) {
     //      const prompt = message.body.substring(9).trim();
     //      await generateImage(prompt, message);
     // }
});

// Réception de messages
client.on('message', async message => {

     if (message.from === '120363048779498866@g.us') {
          console.log("Hahaha");
          return;
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
               scheduleReminder(client, hour, minute);
               message.reply(`Rappel programmé pour ${hour}:${minute}.`);
          } else {
               message.reply('Veuillez utiliser le format : #rappel [heure:minute].');
          }
     }

     if (message.body.toLocaleLowerCase().startsWith('#imagine')) {
          const prompt = message.body.substring(9).trim();
          await generateImage(prompt, message);
     }

     // if (message.body.toLocaleLowerCase().startsWith('#gpt')) {
     //      const prompt = message.body.substring(5).trim();
     //      try {
     //           const response = await getGPTResponse(prompt);
     //           message.reply(response);
     //      } catch (error) {
     //           message.reply('Erreur lors de la communication avec GPT-3.5-turbo.');
     //      }
     // }

     if (message.body.toLocaleLowerCase() === '#help') {
          const helpMessage = `
  Voici la liste des commandes disponibles :
  
  1. *#wiki [sujet]* - Recherche des informations sur Wikipedia sur un sujet donné.
  2. *#quran surah [numéro de sourate]* - Envoie un fichier audio de la sourate spécifiée.
  3. *bonjour* - Répond avec un message de salutation.
  4. *#image [description]* - Génère et envoie une image basée sur la description donnée.
  5. *#hadith* - Envoie un hadith aléatoire parmi une liste préenregistrée.
  6. *#surnom* - Envoie un surnom affectueux en arabe avec sa translittération et sa signification.
  7. *#blague [mode]* - Envoie une blague basée sur le mode spécifié (global ou dev).
  8. *#tagall* - Tag tous les membres d'un groupe.
  9. *#gpt [message]* - Obtenez une réponse de l'IA GPT-3.5-turbo.
  10. *#rappel [heure:minute]* - Programme un rappel à l'heure spécifiée.
  11. *#cwiki [sujet]* - Recherche des informations sur CWiki sur un sujet donné.
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
