const handleTagAllCommand = async (message, client) => {
     const chat = await message.getChat();

     if (message.from === '120363048779498866@g.us') {
          return;
     }

     if (chat.isGroup) {
          let mentions = [];
          let text = `══✪〘   Tag All   〙✪══\n\n➲ Message : ${message}\n`;

          for (let participant of chat.participants) {
               const contact = await client.getContactById(participant.id._serialized);
               mentions.push(contact);
               text += `@${contact.number}\n`;
          }

          chat.sendMessage(text, { mentions }).then(response => {
               console.log('Message envoyé avec les mentions.');
          }).catch(err => {
               console.error('Erreur lors de l\'envoi du message avec mentions :', err);
          });
     } else {
          console.log('Le message n\'a pas été envoyé car ce n\'est pas un groupe.');
     }
};

module.exports = handleTagAllCommand;
