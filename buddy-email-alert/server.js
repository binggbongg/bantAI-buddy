// server.js (Simplified for email notification only)
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors'); 

const app = express();
app.use(express.json());

// *** IMPORTANT: PASTE YOUR ACTUAL CHROME EXTENSION ID HERE ***
const chromeExtensionId = 'kkhmclnemlejinbnbabhhdhmjdkjlpod';
const allowedOrigins = [`chrome-extension://${chromeExtensionId}`];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
}));


// Endpoint for sending email notifications - This is the core functionality
app.post('/send-notification', async (req, res) => {
    console.log('Received request for /send-notification');

    const { email, threatLevel, reason, originalText } = req.body;

    if (!email || !threatLevel || !reason || !originalText) {
        console.warn('Missing required fields in request body.');
        return res.status(400).json({ message: "Please provide 'email', 'threatLevel', 'reason', and 'originalText'." });
    }

    const gmailUser = process.env.GMAIL_USER;
    const gmailAppPassword = process.env.GMAIL_PASSWORD;

    if (!gmailUser || !gmailAppPassword) {
        console.error('Gmail credentials (GMAIL_USER or GMAIL_PASSWORD) not fully set in environment variables.');
        return res.status(500).json({ message: "Backend email service configuration error. Please check App Service settings." });
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: gmailUser,
            pass: gmailAppPassword,
        },
    });

    const mailOptions = {
        from: `"BantAI Buddy" <${gmailUser}>`,
        to: email,
        subject: `🚨 BantAI Buddy Alert! Severe Message Detected (Severity: ${threatLevel})`,
        html: `
            <html>
            <body style="font-family: sans-serif; line-height: 1.6;">
                <div style="max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                    <h2 style="color: #d9534f;">🚨 BantAI Buddy Alert! 🚨</h2>
                    <p>Dear Parent/Guardian,</p>
                    <p>This is an urgent notification from **BantAI Buddy**. A message with a <b>critical threat level of ${threatLevel}</b> has been detected and blocked by the system.</p>
                    
                    <h3 style="color: #333;">Message Details:</h3>
                    <p><strong>Reason for Blocking:</strong> ${reason}</p>
                    <p style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 10px; border-radius: 4px; color: #721c24;">
                        <strong>Original Message:</strong> "${originalText}"
                    </p>
                    
                    <p>Please consider having a conversation with your child about safe online communication. You can also review more details within the **BantAI Buddy** extension.</p>
                    
                    <p>Thank you for using **BantAI Buddy** to keep your children safe online.</p>
                    <p style="font-size: 0.9em; color: #888;">The BantAI Buddy Team</p>
                </div>
            </body>
            </html>
        `,
        text: `
            BantAI Buddy Alert!
            
            Dear Parent/Guardian,
            
            This is an urgent notification from BantAI Buddy. A message with a critical threat level of ${threatLevel} has been detected and blocked by the system.
            
            Message Details:
            Reason for Blocking: ${reason}
            Original Message: "${originalText}"
            
            Please consider having a conversation with your child about safe online communication. You can also review more details within the BantAI Buddy extension.
            
            Thank you for using BantAI Buddy to keep your children safe online.
            
            The BantAI Buddy Team
        `,
    };

    try {
        console.log('Attempting to send email via Nodemailer/Gmail...');
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully via Nodemailer/Gmail:', info.messageId);
        res.status(200).json({ message: "Email notification sent successfully via Nodemailer/Gmail." });
    } catch (error) {
        console.error('Error sending email via Nodemailer/Gmail:', error.message);
        if (error.response) console.error('Nodemailer Error Response:', error.response);
        if (error.responseCode) console.error('Nodemailer Error Response Code:', error.responseCode);
        res.status(500).json({ message: `An error occurred while sending email via Nodemailer/Gmail: ${error.message}` });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});