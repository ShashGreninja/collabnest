import nodemailer from 'nodemailer';
import path from 'path';

interface SendMailOptions {
    to: string;
    subject: string;
    message: string;
    htmlMessage?: string;
    attachmentPath?: string; // absolute or relative path to the file
    attachmentFilename?: string; // optional: name for the attached file
}

const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD, // This password is different from your email password. - Arpit
    },
});

export const sendMail = async ({
    to,
    subject,
    message,
    htmlMessage,
    attachmentPath,
    attachmentFilename,
}: SendMailOptions): Promise<void> => {
    try {
        // For outlook
        // const transporter = nodemailer.createTransport({
        //     host: 'smtp-mail.outlook.com',
        //     secureConnection: false,
        //     port: 587,
        //     auth: {
        //         user: proccess.env.EMAIL_USERNAME,
        //         pass: process.env.EMAIL_PASSWORD,
        //     },
        //     tls: {
        //         ciphers: 'SSLv3',
        //     },
        // });

        const mailOptions: nodemailer.SendMailOptions = {
            from: process.env.EMAIL_SENDER_NAME,
            to,
            subject,
            text: message,
            html: htmlMessage,
        };

        if (attachmentPath) {
            mailOptions.attachments = [
                {
                    filename: attachmentFilename || path.basename(attachmentPath),
                    path: attachmentPath,
                },
            ];
        }

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.response);
    } catch (error) {
        console.error('Error sending email:', (error as Error).message);
    }
};
