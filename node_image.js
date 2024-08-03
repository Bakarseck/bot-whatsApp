const https = require('https');

const prompt = 'beautiful sunset';
const apiToken = 'CTAPI-283AXEaUHGoWpClBBNINsOGwFI';
const url = `https://imageai.codingteamapi.workers.dev/?gen=${prompt}&token=${apiToken}`;

const options = {
    timeout: 30000 // 30 secondes de délai d'attente
};

https.get(url, options, (resp) => {
    let data = [];

    resp.on('data', (chunk) => {
        data.push(chunk);
    });

    resp.on('end', () => {
        try {
            // Join the chunks to form the complete image buffer
            const imageBuffer = Buffer.concat(data);
            console.log('Image générée avec succès');
            // Vous pouvez enregistrer l'image pour vérifier visuellement
            require('fs').writeFileSync('image.png', imageBuffer);
            console.log('Image sauvegardée en tant que image.png');
        } catch (e) {
            console.error('Erreur lors de la génération de l\'image :', e);
        }
    });

}).on("error", (err) => {
    console.error('Erreur lors de la génération de l\'image :', err);
}).setTimeout(options.timeout, () => {
    console.error('Délai d\'attente dépassé pour la génération de l\'image.');
});
