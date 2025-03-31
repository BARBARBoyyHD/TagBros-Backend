import BASE_URL from "../../config/BaseURL";
import { CLIENT_ID, CLIENT_SECRET } from "../../config/Credentials";
import { Request, Response } from "express";
import axios from "axios";
import qs from "qs"; // To properly format the request body

// ✅ Function to get PayPal Access Token
export const getAccessToken = async () => {
  try {
    const response = await axios.post(
      `${BASE_URL}/v1/oauth2/token`,
      qs.stringify({
        grant_type: "client_credentials",
      }),
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${CLIENT_ID}:${CLIENT_SECRET}`
          ).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    return response.data.access_token;
  } catch (error: any) {
    throw new Error(error.response?.data?.error_description || error.message);
  }
};

// ✅ Function to create an order
export const createOrder = async (req: Request, res: Response) => {
  try {
    const accessToken = await getAccessToken();
    const orderData = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: "10.00",
          },
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            return_url: `${BASE_URL}/complete-payment`,
            cancel_url: `${BASE_URL}/cancel-payment`,
          },
        },
      },
    };

    const response = await axios.post(
      `${BASE_URL}/v2/checkout/orders`,
      orderData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    res.status(200).json({ orderID: response.data.id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Function to capture a payment
export const capturePayment = async (req: Request, res: Response) => {
  try {
    const accessToken = await getAccessToken();
    const { orderID } = req.params;

    const response = await axios.post(
      `${BASE_URL}/v2/checkout/orders/${orderID}/capture`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    res.status(200).json({
      message: "Payment Captured",
      data: {
        id: response.data.id,
        status: response.data.status,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
