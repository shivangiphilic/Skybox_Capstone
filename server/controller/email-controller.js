import Email from "../model/email.js";
import Imap from "imap";
import { simpleParser } from "mailparser";
import dotenv from "dotenv";

dotenv.config();

const imapConfig = {
  user: process.env.USER,
  password: process.env.APP_PASSWORD,
  host: "imap.gmail.com",
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false },
};

const fetchEmails = () => {
    return new Promise((resolve, reject) => {
      const imap = new Imap(imapConfig);
  
      imap.once("ready", () => {
        imap.openBox("INBOX", false, (err,box) => {
          // console.log(imap);
          if (err) {
            reject(err);
            return;
          }
          imap.search(["UNSEEN"], (err, results) => {
            if (err) {
              reject(err);
              return;
            }
            if (!results || !results.length) {
              resolve([]);
              imap.end();
              return;
            }
  
            const f = imap.fetch(results, { bodies: "" });
  
            const emails = [];
  
            f.on("message", (msg) => {
              //testing
              const promises = [];
              msg.on("body", (stream) => {
                promises.push(new Promise((resolve, reject) => {
                  simpleParser(stream, async (err, parsed) => {
                    if (err) return reject(err);
  
                    const { from, subject, text, date, messageId } = parsed;
                    const emailData = {
                      to: process.env.USER,
                      from: from.text,
                      subject,
                      body: text,
                      date: date || new Date(),
                      name: "Smart Mail",
                      starred: false,
                      bin: false,
                      type: "inbox",
                    };
  
                    const existingEmail = await Email.findOne({
                      from: emailData.from,
                      subject: emailData.subject,
                      date: emailData.date,
                    });
                    if (!existingEmail) {
                      const email = new Email(emailData);
                      await email.save();
                      emails.push(emailData);
                    }
                    resolve();
                  });
                }));
              });
  
              f.once("end", async () => {
                await Promise.all(promises);
                imap.end();
                resolve(emails);
              });
            });
          });
        });
      });
  
      // imap.once("error", (err) => reject(err));
      imap.once("error", (err) => {
        console.error("IMAP connection error:", err);
        reject(err);
      });
      imap.once("end", () => console.log("Connection ended"));
  
      imap.connect();
    });
  };
  
export const getEmails = async (request, response) => {
    try {
        let emails;

        if (request.params.type === "starred") {
            emails = await Email.find({ starred: true, bin: false }).sort({ date: -1 });
        } 
        else if (request.params.type === "bin") {
            emails = await Email.find({ bin: true }).sort({ date: -1 });
        } 
        else if (request.params.type === "allmail") {
            emails = await Email.find({}).sort({ date: -1 });
        } 
        else if (request.params.type === "inbox") {
            const existingUnreadEmails = await Email.find({
                type: "inbox",
                bin: false,
            }).sort({ date: -1 });
            const newEmails = await fetchEmails();
            emails = [...existingUnreadEmails, ...newEmails];
        } 
        else if (request.params.type === "sent") {
            emails = await Email.find({ type: "sent" }).sort({ date: -1 });
        } 
        else {
            emails = await Email.find({ type: request.params.type }).sort({ date: -1 });
        }

        // Remove any potential duplicates by ID
        emails = emails.filter((email, index, self) =>
            index === self.findIndex((e) => e._id.toString() === email._id.toString())
        );

        response.status(200).json(emails);
    } catch (error) {
        response.status(500).json(error.message);
    }
};

export const saveSendEmails = async (request, response) => {
try {
    const { name, date, from, to, body, subject, type } = request.body;

    if (!name || !date || !from || !to || !type || !subject) {
    return response.status(400).json({ message: "Missing required fields" });
    }

    const email = new Email({ name, date, from, to, body, subject, type });
    await email.save();

    response.status(200).json("Email saved successfully");
} catch (error) {
    console.error("Error saving email:", error);
    response.status(500).json({ message: error.message });
}
};

export const toggleStarredEmail = async (request, response) => {
    try {   
        await Email.updateOne({ _id: request.body.id }, { $set: { starred: request.body.value }})
        response.status(201).json('Value is updated');
    } catch (error) {
        response.status(500).json(error.message);
    }
}

export const deleteEmails = async (request, response) => {
    try {
        await Email.deleteMany({ _id: { $in: request.body }})
        response.status(200).json('emails deleted successfully');
    } catch (error) {
        response.status(500).json(error.message);
    }
}

export const moveEmailsToBin = async (request, response) => {
    try {
        await Email.updateMany({ _id: { $in: request.body }}, { $set: { bin: true, starred: false, type: '' }});
        response.status(200).json("Emails moved to bin");
    } catch (error) {
        response.status(500).json(error.message);   
    }
}