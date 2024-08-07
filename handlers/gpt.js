const axios = require('axios');

const handleGPTCommand = async (message, client, to) => {
     const args = message.body.split(' ');
     const prompt = args.slice(1).join(' ');

     if (!prompt) {
          message.reply('Veuillez fournir un message pour obtenir une réponse de GPT-3.5-turbo. Exemple: #gpt Comment je peux faire pour etre un bon programmeur fullstack');
          return;
     }

     const options = {
          method: 'POST',
          url: 'https://chatgpt-42.p.rapidapi.com/conversationgpt4-2',
          headers: {
               'Content-Type': 'application/json',
               'x-rapidapi-host': 'chatgpt-42.p.rapidapi.com',
               'x-rapidapi-key': '6fcae1b272msh9aeb546116109c4p1a1f3fjsnbab1d30fcfac'
          },
          data: {
               messages: [{ role: 'user', content: prompt }],
               system_prompt: '',
               temperature: 0.9,
               top_k: 5,
               top_p: 0.9,
               max_tokens: 256,
               web_access: false
          }
     };

     try {
          const response = await axios.request(options);
          if (response.data && response.data.result) {
               const gptResponse = response.data.result;
               to ? await client.sendMessage(to, gptResponse) : await client.sendMessage(message.from, gptResponse);
          } else {
               throw new Error('La réponse de l\'API n\'a pas le format attendu.');
          }
     } catch (error) {
          console.error('Erreur lors de la communication avec GPT-3.5-turbo:', error.message);
          message.reply('Désolé, une erreur est survenue lors de la communication avec GPT-3.5-turbo.');
     }
};

module.exports = handleGPTCommand;
