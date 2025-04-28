import Email from "../model/email.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logsDir = path.join(__dirname, "../logs");
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

const assetsDir = path.join(__dirname, "../assets");
if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
}

const pixelPath = path.join(assetsDir, "pixel.png");
if (!fs.existsSync(pixelPath)) {
    // This is a base64 encoded 1x1 transparent PNG
    const pixelData = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
        "base64"
    );
    fs.writeFileSync(pixelPath, pixelData);
}

const logTrackingEvent = (emailId, event, details) => {
    const timestamp = new Date();
    const logEntry = `[${timestamp.toISOString()}] Email ${emailId} - ${event}\n${JSON.stringify(details, null, 2)}\n\n`;
    fs.appendFileSync(path.join(logsDir, "tracking_logs.txt"), logEntry);
};

export const trackPixel = async (req, res) => {
    try {
        const emailId = req.params.id;
        const userAgent = req.headers["user-agent"];
        const ipAddress = req.ip || req.connection.remoteAddress;
        const timestamp = new Date();

        console.log(`[TRACKING] Pixel hit for emailId: ${emailId} at ${timestamp}`);
        // Log the tracking event
        logTrackingEvent(emailId, "Email Opened", {
            timestamp,
            userAgent,
            ipAddress
        });

        // Update email status in database
        const updateResult = await Email.findByIdAndUpdate(
            emailId,
            {
                $set: {
                    status: "read",
                    readTimestamp: timestamp
                }
            },
            { new: true }
        );
        if (updateResult) {
            console.log(`[TRACKING] Status updated to 'read' for emailId: ${emailId}`);
            logTrackingEvent(emailId, "Status Updated", {
                status: "read",
                timestamp,
                email: updateResult
            });
        } else {
            console.log(`[TRACKING] Status update failed (not found) for emailId: ${emailId}`);
            logTrackingEvent(emailId, "Status Update Failed", {
                reason: "Email not found",
                emailId
            });
        }

        // Set headers to prevent caching
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });

        // Send tracking pixel
        res.sendFile(pixelPath);
    } catch (error) {
        console.error("Tracking error:", error);
        logTrackingEvent(req.params.id, "Tracking Error", {
            error: error.message,
            stack: error.stack
        });
        // Still send the pixel even if there's an error
        res.sendFile(pixelPath);
    }
};

export const getEmailStatus = async (req, res) => {
    try {
        const emailId = req.params.id;
        console.log(`[STATUS] Requested emailId: ${emailId}`);
        const email = await Email.findById(emailId);
        if (!email) {
            console.log(`[STATUS] Email not found for id: ${emailId}`);
            logTrackingEvent(emailId, "Status Check Failed", {
                reason: "Email not found"
            });
            return res.status(404).json({ status: "not found" });
        }
        let responseData = {
            status: email.status || "sent",
            timestamp: email.readTimestamp
        };
        logTrackingEvent(emailId, "Status Check", {
            status: email.status || "sent",
            timestamp: email.readTimestamp
        });
        // Set headers to prevent caching
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        res.json(responseData);
    } catch (error) {
        console.error("Status fetch error:", error);
        logTrackingEvent(req.params.id, "Status Check Error", {
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({ error: "Failed to get email status" });
    }
};