import dotenv from "dotenv";
dotenv.config();
console.log("BASE URL :",process.env.PAYPAL_BASEURL);
const BASE_URL = process.env.PAYPAL_BASEURL || "";

export default BASE_URL