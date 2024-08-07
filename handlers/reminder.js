const axios = require('axios');
const { MessageMedia } = require('whatsapp-web.js');
const { generateQuranVerseImage } = require('./utils');

const getPrayerTimes = async () => {
     try {
          const response = await axios.get('https://islam-excellent.vercel.app/api/prayer-times');
          return response.data;
     } catch (error) {
          console.error('Error fetching prayer times:', error);
          throw error;
     }
};

const getRandomAyah = async () => {
     const randomAyahNumber = Math.floor(Math.random() * 6236) + 1;
     const urlText = `https://api.alquran.cloud/v1/ayah/${randomAyahNumber}/editions/quran-simple,fr.hamidullah`;
     const urlAudio = `https://api.alquran.cloud/v1/ayah/${randomAyahNumber}/ar.husary`;

     const [responseText, responseAudio] = await Promise.all([
          axios.get(urlText),
          axios.get(urlAudio)
     ]);

     const dataText = responseText.data.data;
     const dataAudio = responseAudio.data.data;

     return {
          quranText: dataText[0].text,
          translation: dataText[1].text,
          audioUrl: dataAudio.audio,
          surahNumber: dataAudio.surah.number,
          ayahNumber: dataAudio.numberInSurah
     };
};

const predefinedRecipients = [
     '221762773266@c.us',
     '221761987594@c.us',
     '221708535168@c.us',
     '221767745467@c.us',
     '221762803898@c.us',
     '221776896551@c.us',
     '221774005404@c.us',
     '221777220383@c.us'
];

const sendReminder = async (client) => {
     try {
          const prayerTimes = await getPrayerTimes();

          if (!prayerTimes.fajr) {
               throw new Error('fajr time is missing in the response');
          }

          const fajrTimeStr = prayerTimes.fajr;
          const [fajrHour, fajrMinute] = fajrTimeStr.split(':');

          const fajrTime = new Date();
          fajrTime.setHours(parseInt(fajrHour), parseInt(fajrMinute), 0, 0);
          fajrTime.setMinutes(fajrTime.getMinutes() + 60);

          const now = new Date();
          const timeUntilReminder = fajrTime - now;

          if (timeUntilReminder > 0) {
               setTimeout(async () => {
                    const { quranText, translation, audioUrl, surahNumber, ayahNumber } = await getRandomAyah();
                    const { arabicImagePath, frenchImagePath } = await generateQuranVerseImage(surahNumber, ayahNumber, quranText, translation);
                    const reply = `\t\t*Ayah Fajr Gui* \n\n\n Sourate: ${surahNumber} Ayah: ${ayahNumber}\n\n ${quranText}\n\n\n ${translation}`;

                    for (const recipient of predefinedRecipients) {

                         if (arabicImagePath) {
                              const arabicMedia = MessageMedia.fromFilePath(arabicImagePath);
                              await client.sendMessage(recipient, arabicMedia);
                         }

                         if (frenchImagePath && frenchImagePath !== arabicImagePath) {
                              const frenchMedia = MessageMedia.fromFilePath(frenchImagePath);
                              await client.sendMessage(recipient, frenchMedia);
                         }

                         const audioResponse = await axios.get(audioUrl, { responseType: 'arraybuffer' });
                         const audioBuffer = Buffer.from(audioResponse.data, 'binary').toString('base64');
                         const media = new MessageMedia('audio/mpeg', audioBuffer);

                         await client.sendMessage(recipient, media);
                    }
               }, timeUntilReminder);
          } else {
               console.log('L\'heure de rappel est déjà passée pour aujourd\'hui.');
          }
     } catch (error) {
          console.error('Error in sendReminder:', error);
     }
};

const scheduleReminder = async (client, hour, minute, message) => {
     try {
          const now = new Date();
          const reminderTime = new Date();
          reminderTime.setHours(parseInt(hour), parseInt(minute), 0, 0);

          const timeUntilReminder = reminderTime - now;

          if (timeUntilReminder > 0) {
               setTimeout(async () => {
                    if (message) {
                         await client.sendMessage(recipient, message);
                    } else {
                         const { quranText, translation, audioUrl, surahNumber, ayahNumber } = await getRandomAyah();
                         const { arabicImagePath, frenchImagePath } = await generateQuranVerseImage(surahNumber, ayahNumber, quranText, translation);

                         for (const recipient of predefinedRecipients) {

                              if (arabicImagePath) {
                                   const arabicMedia = MessageMedia.fromFilePath(arabicImagePath);
                                   await client.sendMessage(recipient, arabicMedia);
                              }

                              if (frenchImagePath && frenchImagePath !== arabicImagePath) {
                                   const frenchMedia = MessageMedia.fromFilePath(frenchImagePath);
                                   await client.sendMessage(recipient, frenchMedia);
                              }

                              const audioResponse = await axios.get(audioUrl, { responseType: 'arraybuffer' });
                              const audioBuffer = Buffer.from(audioResponse.data, 'binary').toString('base64');
                              const media = new MessageMedia('audio/mpeg', audioBuffer);

                              await client.sendMessage(recipient, media);
                         }
                    }
               }, timeUntilReminder);
          } else {
               console.log('L\'heure de rappel est déjà passée pour aujourd\'hui.');
          }
     } catch (error) {
          console.error('Error in scheduleReminder:', error);
     }
};

module.exports = {
     sendReminder,
     scheduleReminder
};
