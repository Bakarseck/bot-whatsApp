const axios = require('axios');

const handleWikipediaCommand = async (message) => {
    const args = message.body.split(' ');
    const query = args.slice(1).join(' ');

    if (!query) {
        message.reply('Veuillez fournir un terme de recherche. Utilisation : #wiki <terme de recherche>');
        return;
    }

    try {
        // Rechercher l'article
        const searchUrl = `https://fr.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json`;
        const searchResponse = await axios.get(searchUrl, { timeout: 10000 });
        const searchResults = searchResponse.data.query.search;

        if (searchResults.length === 0) {
            message.reply('Aucun résultat trouvé.');
            return;
        }

        // Récupérer le premier résultat
        const firstResult = searchResults[0];
        const pageId = firstResult.pageid;
        const title = firstResult.title;

        // Obtenir le résumé de l'article
        const summaryUrl = `https://fr.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&titles=${encodeURIComponent(title)}&format=json`;
        const summaryResponse = await axios.get(summaryUrl, { timeout: 10000 });
        const pages = summaryResponse.data.query.pages;
        const page = pages[pageId];

        if (!page || !page.extract) {
            message.reply('Désolé, un problème est survenu lors de la récupération du résumé.');
            return;
        }

        const summary = page.extract;

        // Répondre avec le résumé
        const reply = `*${title}*\n\n${summary}`;
        message.reply(reply);
    } catch (error) {
        console.error('Erreur lors de la recherche sur Wikipédia :', error);
        message.reply('Désolé, une erreur est survenue lors de la recherche.');
    }
};

module.exports = handleWikipediaCommand;
