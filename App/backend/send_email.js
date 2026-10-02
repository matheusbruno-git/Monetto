const path = require("path");

require("dotenv").config({
    path: path.resolve(__dirname, "../../.env")
});

const nodemailer = require("nodemailer");
console.log("EMAIL_USER:", process.env.EMAIL_USER ? "Loaded" : "MISSING");
console.log("EMAIL_PASSWORD:", process.env.EMAIL_PASSWORD ? "Loaded" : "MISSING");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

transporter.verify((error, success) => {
    if (error) {
        console.error("SMTP verification failed:", error);
    } else {
        console.log("SMTP connection ready:", success);
    }
});

async function sendEmail(dados) {
    try {
        if (!dados || !dados.to) {
            throw new Error("Missing email recipient (dados.to)");
        }

        if (!dados.subject) {
            throw new Error("Missing email subject (dados.subject)");
        }

        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: dados.to,
            subject: dados.subject,
            text: dados.message || "",
            html: dados.html || ""
        });

        console.log("Email sent:", info.messageId);

        return {
            success: true,
            messageId: info.messageId
        };

    } catch (error) {
        console.error("Error sending email:", error);

        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = { sendEmail };