import dotenv from "dotenv";
dotenv.config();
import express from "express";
import GetIgHastags from "./routes/instagram/GetIgHastag";
import { createOrder, capturePayment } from "./routes/payment/paypal"; // ✅ Import functions directly
import { getListProduct,getSubsDetail,createSubscription,activateSubscription } from "./routes/payment/subscription";
import { webHook } from "./routes/payment/webHook";

import cors from "cors";

const app = express();
const port = process.env.PORT;

// ✅ CORS for frontend connection (update origin for production)
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.json("hello");
});

// ✅ Use payment routes directly instead of `app.use()`
app.post("/api/payment/paypal/createorder", createOrder);
app.post("/api/payment/paypal/capturepayment/:orderID", capturePayment);
app.post("/api/get/ig/hashtag", GetIgHastags);
app.post("/webhook/paypal",webHook)
app.post("/api/subscriptions/plans/:id",createSubscription)
app.post("/api/activate-subscription", activateSubscription);

app.get("/api/paypal/product/list",getListProduct)
app.get("/api/subs/detail/:id",getSubsDetail)


app.listen(port, () => {
    console.log(`http://localhost:${port}`);
});
