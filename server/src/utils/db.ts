import mongoose from "mongoose";

import "../models";
import { config } from "../config/env";

const ensureConnectionEvents = () => {
  if (mongoose.connection.listeners("connected").length === 0) {
    mongoose.connection.on("connected", () => {
      console.log("Connected to MongoDB");
    });
  }

  if (mongoose.connection.listeners("error").length === 0) {
    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
    });
  }
};

export const connectDB = async (): Promise<typeof mongoose> => {
  const { uri } = config.database;

  if (mongoose.connection.readyState === 1) {
    ensureConnectionEvents();
    return mongoose;
  }

  try {
    if (mongoose.connection.readyState === 2) {
      ensureConnectionEvents();
      return mongoose;
    }

    ensureConnectionEvents();
    await mongoose.connect(uri);
    return mongoose;
  } catch (error) {
    console.error("Failed to connect to MongoDB", error);
    throw error;
  }
};

export default connectDB;
