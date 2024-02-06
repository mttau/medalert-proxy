const express = require('express');
const fetch = require('node-fetch');
const https = require('https'); // Import the https module
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Existing CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Existing CORS preflight handling
app.options('/proxy', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.send();
});

// Existing proxy route
app.all('/proxy', async (req, res) => {
    const url = req.query.url;
    if (!url) {
        return res.status(400).send('URL parameter is required');
    }

    const agent = new https.Agent({  
        rejectUnauthorized: false // This disables SSL certificate validation
    });

    try {
        const response = await fetch(url, {
            method: req.method,
            headers: req.headers,
            body: ['GET', 'HEAD'].includes(req.method) ? null : JSON.stringify(req.body),
            agent: agent // Use the custom agent
        });

        const data = await response.text();
        res.send(data);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
});

// New endpoint for handling deactivation requests
// (Your existing /deactivate endpoint code remains unchanged)

// New endpoint for sending SMS messages
app.post('/sendSms', async (req, res) => {
    const { iccid, messageText } = req.body;
    const apiVersion = '1'; // Adjusted to a string for URL construction
    const targetUrl = `https://restapi10.jasper.com/rws/api/v${apiVersion}/devices/${iccid}/smsMessages`;

    // Use environment variables or a secure method for storing credentials
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
        // Add any other required fields as per your needs
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
