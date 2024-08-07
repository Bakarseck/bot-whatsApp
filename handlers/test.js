const axios = require("axios");
const fs = require("fs");
const path = require("path");

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NjE1ODYsImVtYWlsIjoic2Vjay5iYWthckB1Z2IuZWR1LnNuIiwidXNlcm5hbWUiOiJzZWNrLmJha2FyQHVnYi5lZHUuc24iLCJpYXQiOjE3MjIzOTQ0MDV9.ASPYRydcvbVvkeLE3ubpkEX1iXCdpWBnl3uI0iKKaXk';

const generateImage = async () => {
    try {
        // Step 1: Initiate image generation
        const config = {
            method: "post",
            url: "https://api.imaginepro.ai/api/v1/midjourney/imagine",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${TOKEN}`,
            },
            data: {
                prompt: "A little cat running on the grass",
            },
        };

        const initiateResponse = await axios(config);
        const { messageId } = initiateResponse.data;
        console.log('Image generation initiated, messageId:', messageId);

        // Step 2: Check the status and get the image URL
        let imageUrl = null;
        while (!imageUrl) {
            const statusResponse = await axios({
                method: "get",
                url: `https://api.imaginepro.ai/api/v1/midjourney/message/${messageId}`,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${TOKEN}`,
                },
            });

            if (statusResponse.data && statusResponse.data.uri && statusResponse.data.status === "DONE") {
                imageUrl = statusResponse.data.uri;
                console.log('Image URL retrieved:', imageUrl);
            } else {
                console.log('Image not ready yet, retrying...');
                await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 5 seconds before retrying
            }
        }

        // Step 3: Download the image
        const imagePath = path.resolve(__dirname, "image.jpg");

        const downloadResponse = await axios({
            url: imageUrl,
            method: 'GET',
            responseType: 'stream',
        });

        const writer = fs.createWriteStream(imagePath);
        downloadResponse.data.pipe(writer);

        writer.on('finish', () => {
            console.log('Image downloaded successfully');
        });

        writer.on('error', (err) => {
            console.error('Error writing the image file', err);
        });

    } catch (error) {
        console.error('Error with the API request', error);
    }
};

generateImage();
