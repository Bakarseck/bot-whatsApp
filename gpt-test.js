const axios = require('axios');

const options = {
     method: 'POST',
     url: 'https://chatgpt-42.p.rapidapi.com/conversationgpt4-2',
     headers: {
          'Content-Type': 'application/json',
          'x-rapidapi-host': 'chatgpt-42.p.rapidapi.com',
          'x-rapidapi-key': '6fcae1b272msh9aeb546116109c4p1a1f3fjsnbab1d30fcfac'
     },
     data: {
          messages: [{ role: 'user', content: 'Comment je peux faire pour etre un bon programmeur fullstack' }],
          system_prompt: '',
          temperature: 0.9,
          top_k: 5,
          top_p: 0.9,
          max_tokens: 256,
          web_access: false
     }
};

axios.request(options).then(function (response) {
     console.log(response.data);
}).catch(function (error) {
     console.error(error);
});
