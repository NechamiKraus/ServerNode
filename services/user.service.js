const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require('dotenv').config()
const mailPassword = process.env.MAIL_PASSWORD
const actorModel = require("../models/actor.model");
const managerModel = require("../models/manager.model");
const condidateModel = require("../models/candidate.model");
const directorModel = require("../models/director.model");
const showModel = require("../models/show.model");
const QRCode = require('qrcode');
const orderModel = require('../models/order.model')
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const { default: mongoose } = require("mongoose");

const orderTicket = async (email, name, phone, amount, showId) => {
    try {
        const qrCodeData = await QRCode.toDataURL(`${name},${email},${phone},${amount},${showId}`);
        // יצירת קובץ PDF בזיכרון
        const doc = new PDFDocument();
        let pdfBuffer = [];

        doc.on('data', pdfBuffer.push.bind(pdfBuffer));
        doc.on('end', async () => {
            const finalBuffer = Buffer.concat(pdfBuffer);
            const pdfBase64 = finalBuffer.toString('base64');

            // יצירת מסמך הזמנה חדש ושמירתו ב-DB יחד עם ה-PDF
            const order = new orderModel({
                name,
                phone,
                email,
                amount,
                showId,
                qrCode: qrCodeData,
                pdf: pdfBase64  // שמירת קובץ ה-PDF כ-Base64 ב-DB
            });

            await order.save();
            // הגדרת שליחת המייל עם Nodemailer
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'stagehub1@gmail.com',
                    pass: mailPassword,
                }
            });

            const mailOptions = {
                from: 'nechami6322@gmail.com',
                to: email,
                subject: 'ההזמנה שלך',
                text: 'הרשמתכם בוצעה בהצלחה!',
                attachments: [
                    {
                        filename: `${email}.pdf`,
                        content: finalBuffer,
                        contentType: 'application/pdf'
                    }
                ]
            };

            // שליחת המייל
            console.log('Sending email...');
            await transporter.sendMail(mailOptions);
            console.log('Email sent successfully');
        });

        const updatedShow = await showModel.findByIdAndUpdate(
            new mongoose.Types.ObjectId(showId),
            { $inc: { numAvailableTickets: -amount } },
            { new: true }
        );

        // כתיבת תוכן ה-PDF
        doc.fontSize(20).text(`הזמנה למופע ${updatedShow.name}`, { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`שם: ${name}`);
        doc.text(`טלפון: ${phone}`);
        doc.text(`מספר כרטיסים: ${amount}`);
        doc.moveDown();

        // הוספת קוד ה-QR ל-PDF
        doc.image(qrCodeData, {
            fit: [100, 100],
            align: 'center',
            valign: 'center'
        });

        doc.end(); // סיום יצירת ה-PDF בזיכרון

        // החזרת תגובה
        return { statusCode: 200, message: 'Order ticket successfully created and sent via email' };

    } catch (error) {
        return { statusCode: 400, message: `Failed to order ticket: ${error.message}` };
    }
};



const connectUser = async (model, role, email, password) => {
    try {
        const user = await model.findOne({ email });

        if (!user) {
            return { statusCode: 404, message: `${role} not found` };
        }

        const validPassword = await bcrypt.compare(password, user.password);

        if (validPassword) {
            const token = jwt.sign({
                name: user.name,
                phone: user.phone,
                email,
                password: user.password,
                role
            }, process.env.TOKEN_SECRET);
            return { statusCode: 200, id: String(user._id), token };
        } else {
            return { statusCode: 401, message: "Invalid password" };
        }
    } catch (error) {
        return { statusCode: 400, message: `Something went wrong while trying to connect the ${role}: ${error.message}` };
    }
};


const addCondidate = async (name, phone, email, password, publicPassword) => {
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    const condidate = new condidateModel({
        name,
        phone,
        email,
        password: hashPassword,
        publicPassword
    })
    return condidate.save();
}

const getAllShows = async () => {
    try {
        return showModel.find();
    }
    catch (error) {
        return { statusCode: 400, message: `fail to get shows: ${error.message}` };
    }
}


module.exports = {
    addCondidate,
    connectUser,
    getAllShows,
    orderTicket
};