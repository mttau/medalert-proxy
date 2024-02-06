const express = require('express');
const fetch = require('node-fetch');
const https = require('https');
const cors = require('cors'); // Import the cors module
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Use cors middleware to handle CORS requests
app.use(cors({
    origin: '*' // This will allow access from any origin. Adjust as necessary for production.
}));

// Remove manual CORS headers setup since cors middleware is used

// Proxy route
app.all('/proxy', async (req, res) => {
    const url = req.query.url;
    if (!url) {
        return res.status(400).send('URL parameter is required');
    }

    const agent = new https.Agent({  
        rejectUnauthorized: false // Note: disabling SSL certificate validation may pose a security risk
    });

    try {
        const response = await fetch(url, {
            method: req.method,
            headers: req.headers,
            body: ['GET', 'HEAD'].includes(req.method) ? null : JSON.stringify(req.body),
            agent: agent
        });

        const data = await response.text();
        res.send(data);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Endpoint for handling deactivation requests remains unchanged

// Endpoint for sending SMS messages
app.post('/sendSms', async (req, res) => {
    const { iccid, messageText } = req.body;
    const apiVersion = '1';
    const targetUrl = `https://restapi10.jasper.com/rws/api/v${apiVersion}/devices/${iccid}/smsMessages`;

    // Use environment variables for storing credentials securely
    const username = process.env.JASPER_USERNAME;
    const apiKey = process.env.JASPER_API_KEY;
    const encodedCredentials = Buffer.from(username + ':' + apiKey).toString('base64');

    const headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": "Basic " + encodedCredentials
    };

    const data = {
        "messageText": messageText,
    };

    try {
        const apiResponse = await fetch(targetUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(data)
        });

        if (!apiResponse.ok) {
            throw new Error(`HTTP error! status: ${apiResponse.status}`);
        }

        const apiData = await apiResponse.json();
        res.json(apiData);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send({ error: error.message });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
