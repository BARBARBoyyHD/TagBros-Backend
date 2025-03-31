import dotenv from "dotenv";
dotenv.config();

const subsClientID = process.env.PAYPAL_SUBS_CLIENT_ID || "";
const subsClientSecret = process.env.PAYPAL_SUBS_CLIENT_SECRET || "";

export { subsClientID, subsClientSecret };
