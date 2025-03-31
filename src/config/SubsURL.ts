import dotenv from "dotenv";
dotenv.config();
const SUBS_BASE_URL = process.env.PAYPAL_LIVE_BASEURL;

export default SUBS_BASE_URL;
