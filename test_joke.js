const https = require('https');

const mode = 'dev';
const url = `https://blague-api.vercel.app/api?mode=${mode}`;

const options = {
    timeout: 30000 // 30 secondes de délai d'attente
};

https.get(url, options, (resp) => {
    let data = '';

    resp.on('data', (chunk) => {
        data += chunk;
    });

    resp.on('end', () => {
        try {
            const response = JSON.parse(data);
            const blague = response.blague;
            const reponse = response.reponse;

            // Afficher la blague dans la console
            console.log(`Blague: ${blague} \nRéponse: ${reponse}`);
        } catch (e) {
            console.error('Erreur lors de la récupération de la blague :', e);
            console.error('Réponse reçue :', data);
        }
    });

}).on("error", (err) => {
    console.error('Erreur lors de la récupération de la blague :', err);
}).setTimeout(options.timeout, () => {
    console.error('Délai d\'attente dépassé pour la récupération de la blague.');
});
