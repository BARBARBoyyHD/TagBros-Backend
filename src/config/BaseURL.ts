import dotenv from "dotenv";
dotenv.config();

const BASE_URL = process.env.PAYPAL_BASEURL || "";

export default BASE_URL