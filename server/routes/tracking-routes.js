import express from "express";
import { trackPixel, getEmailStatus } from "../controller/tracking-controller.js";

const trackingRoutes = express.Router();

// Tracking pixel route
trackingRoutes.get("/pixel/:id", trackPixel);

// Email status API
trackingRoutes.get("/status/:id", getEmailStatus);

export default trackingRoutes;