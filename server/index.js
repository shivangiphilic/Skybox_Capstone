import mongoose from 'mongoose';
import express from 'express';
import cors from 'cors';
import Connection from './database/db.js';
import routes from './routes/route.js';
import trackingRoutes from './routes/tracking-routes.js';
import Email from './model/email.js';

import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

import nodemailer from "nodemailer";

const app = express();

app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:3001"
  ],
  credentials: true
}));
app.use(express.urlencoded());
app.use(express.json());
app.use('/', routes);
app.use('/tracking', trackingRoutes);

const PORT = 8000;

app.get('/', (req, res) => {
  res.send(`Server is running`);
});

//sending mail
const transporter = nodemailer.createTransport({
  service: "gmail",   
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.USER,
    pass: process.env.APP_PASSWORD,
  },
});

const sendMail = async (mailOptions) => {
  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
  } catch (err) {
    console.log(err);
  }   
}

// Access your API key as an environment variable (see "Set up your API key" above)
const genAI = new GoogleGenerativeAI(process.env.API_KEY);


app.post('/generate', async (req, res) => {
    const prompt = req.body.prompt;
    
    if (!prompt) {
      return res.status(400).send({ error: 'Prompt is required' });
    }
  
    // For text-only input, use the gemini-pro model
    const model = genAI.getGenerativeModel({model: "gemini-2.0-flash"});
  
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    // console.log(text);
    res.send({ generatedText: text });
  });

// New route for sending emails
app.post('/sendEmail', async (req, res) => {
  try {
      const mailContent = req.body.mailContent;
      const subject = req.body.subject;
      const to = req.body.to;
      
      // Backend validation for recipient
      if (!to || to.trim() === "") {
          return res.status(400).send({ error: "Recipient email address is required." });
      }
      
      // Generate a new email ID
      const emailId = new mongoose.Types.ObjectId();
      
      // Use ngrok public URL for tracking pixel
      const baseUrl = `https://8f5d-115-99-88-77.ngrok-free.app`;
      const trackingPixelUrl = `${baseUrl}/tracking/pixel/${emailId}`;
      
      // Log the pixel URL for debugging
      console.log(`Creating email with tracking pixel: ${trackingPixelUrl}`);
      
      // Make the pixel visible for debugging
      const trackingPixel = `<img src="${trackingPixelUrl}" width="20" height="20" alt="tracker" style="display:block; border: 1px solid red;">`;
      const htmlContent = `<p>${mailContent.replace(/\n/g, "<br>")}</p>${trackingPixel}`;
      
      const mailOptions = {
          from: {
              name: "SkyBox",
              address: process.env.USER
          }, 
          to: to,
          subject: subject,
          text: mailContent,
          html: htmlContent,
      };

      // Send email
      await sendMail(mailOptions);
      
      // Save email record with tracking details
      const email = new Email({
          _id: emailId,
          name: "SkyBox",
          from: process.env.USER,
          to: to,
          subject: subject,
          body: mailContent,
          date: new Date(),
          type: "sent",
          status: "sent"  // Initial status is sent
      });
      
      await email.save();
      console.log(`Email saved with ID: ${emailId}`);
      
      res.status(200).send({ message: "Email sent successfully", emailId });
  } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).send({ error: "Error sending email", details: error.message });
  }
});

Connection();

app.listen(PORT, '0.0.0.0', () => console.log(`Server started on PORT ${PORT}`));