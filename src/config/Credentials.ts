import dotenv from "dotenv";
dotenv.config();

const CLIENT_ID = process.env.PAYPAL_CLIENT_ID || "";
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || "";

export { CLIENT_ID, CLIENT_SECRET };