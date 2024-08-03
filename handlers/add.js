const axios = require('axios');

const handleAddPrayerCommand = async (message) => {
    const args = message.body.split(' ');

    if (args.length < 6) {
        message.reply('Veuillez fournir les horaires de prière au format: #add-prayer fajr dhuhr asr maghrib isha');
        return;
    }

    const [command, soubh, fajr, dhuhr, asr, maghrib, isha] = args;

    try {
        const response = await axios.post('https://islam-excellent.vercel.app/api/prayer-times', {
            soubh,
            fajr,
            dhuhr,
            asr,
            maghrib,
            isha
        });

        if (response.status === 201) {
            message.reply('Les horaires de prière ont été ajoutés avec succès.');
        } else {
            message.reply('Erreur lors de l\'ajout des horaires de prière.');
        }
    } catch (error) {
        console.error('Erreur lors de l\'ajout des horaires de prière:', error);
        message.reply('Erreur lors de l\'ajout des horaires de prière. Veuillez réessayer plus tard.');
    }
};

module.exports = handleAddPrayerCommand;
