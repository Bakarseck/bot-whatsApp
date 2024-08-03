#!/bin/bash

# Créer la structure des dossiers
mkdir -p whatsapp-bot/public
mkdir whatsapp-bot/received-files
mkdir whatsapp-bot/status-files

# Naviguer dans le dossier du projet
cd whatsapp-bot

# Créer les fichiers de base
touch public/index.html public/style.css public/script.js server.js package.json

# Ajouter du contenu aux fichiers
cat > public/index.html << EOL
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WhatsApp Bot</title>
    <link rel="stylesheet" href="style.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
</head>
<body>
    <div id="qr-container">
        <h1>Scan QR Code to Login</h1>
        <div id="qr-code"></div>
    </div>
    <div id="content">
        <h1>WhatsApp Messages</h1>
        <div id="messages"></div>
    </div>
    <script src="/socket.io/socket.io.js"></script>
    <script src="script.js"></script>
</body>
</html>
EOL

cat > public/style.css << EOL
body {
    font-family: Arial, sans-serif;
    background-color: #f4f4f4;
    color: #333;
    text-align: center;
    padding: 20px;
}

#qr-container {
    display: none;
}

#content {
    display: none;
}

#qr-code {
    width: 256px;
    margin: 0 auto;
}

#messages {
    text-align: left;
    max-width: 600px;
    margin: 0 auto;
    padding: 10px;
    background-color: #fff;
    border: 1px solid #ddd;
    border-radius: 4px;
    overflow-y: auto;
    max-height: 400px;
}

.message {
    padding: 10px;
    border-bottom: 1px solid #eee;
}
EOL

cat > public/script.js << EOL
const socket = io();

socket.on('qr', (qr) => {
    document.getElementById('qr-container').style.display = 'block';
    document.getElementById('content').style.display = 'none';

    const qrCodeContainer = document.getElementById('qr-code');
    qrCodeContainer.innerHTML = '';
    new QRCode(qrCodeContainer, {
        text: qr,
        width: 256,
        height: 256,
    });
});

socket.on('ready', () => {
    document.getElementById('qr-container').style.display = 'none';
    document.getElementById('content').style.display = 'block';
});

socket.on('message', (msg) => {
    const messagesContainer = document.getElementById('messages');
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.innerText = \`\${msg.from}: \${msg.body}\`;
    messagesContainer.appendChild(messageElement);
});
EOL

cat > server.js << EOL
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// Utiliser LocalAuth pour la persistance de la session
const client = new Client({
    authStrategy: new LocalAuth()
});

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

client.on('qr', (qr) => {
    console.log('QR code reçu, envoi au client...');
    io.emit('qr', qr);
});

client.on('ready', () => {
    console.log('Le client est prêt.');
    io.emit('ready');
});

client.on('message', async message => {
    console.log(\`Message reçu de \${message.from}: \${message.body}\`);
    io.emit('message', {
        from: message.from,
        body: message.body,
        hasMedia: message.hasMedia
    });

    if (message.body.toLowerCase() === '#surnom') {
        const surnoms = [
            { arabe: "حبيبتي", transliteration: "Habibti", signification: "mon amour" },
            { arabe: "عمري", transliteration: "Omri", signification: "ma vie" },
            { arabe: "روحي", transliteration: "Rouhi", signification: "mon âme" },
            { arabe: "غاليتي", transliteration: "Ghalyti", signification: "ma précieuse" },
            { arabe: "زهرتي", transliteration: "Zahreti", signification: "ma fleur" },
            { arabe: "قمر", transliteration: "Qamar", signification: "mon étoile" },
            { arabe: "أميرة", transliteration: "Amira", signification: "princesse" },
            { arabe: "نور عيني", transliteration: "Noor 'Ayni", signification: "la lumière de mes yeux" },
            { arabe: "ملاكي", transliteration: "Malaki", signification: "mon ange" },
            { arabe: "دنيتي", transliteration: "Dunyati", signification: "mon monde" }
        ];
        const randomSurnom = surnoms[Math.floor(Math.random() * surnoms.length)];
        const replyMessage = \`\${randomSurnom.arabe} (\${randomSurnom.transliteration}) - Signifie "\${randomSurnom.signification}".\`;
        message.reply(replyMessage);
    }

    if (message.from.includes('status')) {
        console.log('Message provenant d\'un statut:', message);

        if (message.hasMedia) {
            try {
                const media = await message.downloadMedia();
                if (media && media.mimetype) {
                    const mediaExtension = media.mimetype.split('/')[1];
                    const filePath = path.join(__dirname, \`status-files/\${message.id.id}.\${mediaExtension}\`);
                    fs.writeFile(filePath, media.data, 'base64', (err) => {
                        if (err) {
                            console.error('Erreur lors de la sauvegarde du statut :', err);
                        } else {
                            console.log(\`Statut enregistré : \${filePath}\`);
                        }
                    });
                } else {
                    console.error('Le média téléchargé n\'a pas de type MIME ou est invalide.');
                }
            } catch (err) {
                console.error('Erreur lors du téléchargement du média du statut :', err);
            }
        } else {
            console.log('Le statut ne contient pas de média.');
        }
    }

    if (message.body.toLowerCase() === 'bonjour') {
        message.reply('Bonjour ! Comment puis-je vous aider aujourd\'hui ?');
    }

    if (message.body.toLowerCase() === '#tagall' && message.fromMe) {
        console.log("Commande #tagall détectée provenant de vous");
        const chat = await message.getChat();
        if (chat.isGroup) {
            let mentions = [];
            let text = '══✪〘   Tag All   〙✪══\\n\\n➲ Message : blank Message\\n';

            for (let participant of chat.participants) {
                const contact = await client.getContactById(participant.id._serialized);
                mentions.push(contact);
                text += \`@\${contact.pushname || contact.number}\\n\`;
            }

            chat.sendMessage(text, { mentions }).then(response => {
                console.log('Message envoyé avec les mentions.');
            }).catch(err => {
                console.error('Erreur lors de l\'envoi du message avec mentions :', err);
            });
        }
    }

    if (message.hasMedia) {
        try {
            const media = await message.downloadMedia();
            if (media && media.mimetype) {
                const mediaExtension = media.mimetype.split('/')[1];
                const filePath = path.join(__dirname, \`received-files/\${message.id.id}.\${mediaExtension}\`);
                fs.writeFile(filePath, media.data, 'base64', (err) => {
                    if (err) {
                        console.error(\`Erreur lors de la sauvegarde du fichier média (\${media.mimetype}) :\`, err);
                    } else {
                        console.log(\`Fichier média enregistré : \${filePath}\`);
                    }
                });
            } else {
                console.error('Le média téléchargé n\'a pas de type MIME ou est invalide.');
            }
        } catch (err) {
            console.error('Erreur lors du téléchargement du média :', err);
        }
    }
});

client.initialize();

// Socket.io pour la communication en temps réel
io.on('connection', (socket) => {
    console.log('Un utilisateur est connecté');
});

http.listen(3000, () => {
    console.log('Écoute sur le port 3000');
});
EOL

cat > package.json << EOL
{
  "name": "whatsapp-bot",
  "version": "1.0.0",
  "description": "WhatsApp Bot with Web Interface",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.17.1",
    "fs": "0.0.1-security",
    "path": "^0.12.7",
    "qrcode-terminal": "^0.12.0",
    "socket.io": "^4.1.3",
    "whatsapp-web.js": "^1.15.0"
  }
}
EOL

# Installer les dépendances
npm install

echo "Projet créé avec succès. Vous pouvez maintenant exécuter 'npm start' pour démarrer le serveur."
