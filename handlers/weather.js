const { weather } = require('coding-weather');

const handleWeatherCommand = async (message) => {
     const args = message.body.split(' ');

     if (args.length < 2) {
          message.reply('Utilisation: #weather [ville] ou #weather [latitude] [longitude]');
          return;
     }

     try {
          let weatherData;
          if (args.length === 2) {
               // Mode ville
               const cityName = args[1];
               weatherData = await weather(cityName, undefined, 'fr');
          } else if (args.length === 3) {
               // Mode coordonnées
               const latitude = parseFloat(args[1]);
               const longitude = parseFloat(args[2]);
               weatherData = await weather(latitude, longitude, 'fr');
          } else {
               message.reply('Utilisation incorrecte. Utilisation: #weather [ville] ou #weather [latitude] [longitude]');
               return;
          }

          if (!weatherData || !weatherData.lieu || !weatherData.actuel) {
               throw new Error('Données météorologiques incomplètes reçues');
          }

          const response = `
Météo pour ${weatherData.lieu.nom}, ${weatherData.lieu.region}, ${weatherData.lieu.pays}:
- Température: ${weatherData.actuel.temp_c}°C (${weatherData.actuel.temp_f}°F)
- Conditions: ${weatherData.meteo.principal}
- Vent: ${weatherData.actuel.vitesse_vent_kph} kph (${weatherData.actuel.vitesse_vent_mph} mph) venant du ${weatherData.actuel.direction_vent}
- Humidité: ${weatherData.actuel.humidite}%
- Pression: ${weatherData.actuel.pression_mb} mb (${weatherData.actuel.pression_in} in)
- Visibilité: ${weatherData.actuel.visibilite_km} km (${weatherData.actuel.visibilite_miles} miles)
- Indice UV: ${weatherData.actuel.indice_uv}
- Dernière mise à jour: ${weatherData.actuel.dernier_maj}
        `;

          message.reply(response);

     } catch (error) {
          console.error('Erreur lors de la récupération des données météorologiques:', error);
          message.reply('Désolé, une erreur est survenue lors de la récupération des données météorologiques.');
     }
};

module.exports = handleWeatherCommand;
