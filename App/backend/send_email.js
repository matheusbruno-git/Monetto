const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});


async function sendEmail(dados) {
    await transporter.sendMail({
        from: dados.from,
        to: dados.to,
        subject: dados.subject,
        text: dados.message,
        html: dados.html
    });
}

module.exports = { sendEmail };
