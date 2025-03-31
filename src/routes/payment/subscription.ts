import BASE_URL from "../../config/BaseURL";
import { CLIENT_ID, CLIENT_SECRET } from "../../config/Credentials";
import { Request, Response } from "express";
import axios from "axios";
import qs from "qs"; // To properly format the request body

// ✅ Function to get PayPal Access Token
export const getAccessToken = async (): Promise<string> => {
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

    console.log("📌 sub-accessToken:", response.data.access_token);
    return response.data.access_token;
  } catch (error: any) {
    console.error(
      "❌ Failed to get access token:",
      error.response?.data || error.message
    );
    throw new Error(error.response?.data?.error_description || error.message);
  }
};

// ✅ Function to Get List of Subscription Plans
export const getListProduct = async (req: Request, res: Response) => {
  try {
    const accessToken = await getAccessToken(); // ✅ Ensure we wait for the access token

    // ✅ Fetch PayPal Subscription Plans
    const response = await axios.get(
      `${BASE_URL}/v1/billing/plans?sort_by=create_time&sort_order=desc`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`, // ✅ Use the correct token
          "Content-Type": "application/json",
          Accept: "application/json",
          Prefer: "return=representation",
        },
      }
    );

    console.log("✅ PayPal Plans:", response.data);
    res.status(200).json(response.data); // ✅ Return plans to frontend
    return;
  } catch (error: any) {
    console.error(
      "❌ Error fetching PayPal Plans:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: error.message }); // ✅ Handle errors properly
    return;
  }
};

export const getSubsDetail = async (req: Request, res: Response) => {
  try {
    const accessToken = await getAccessToken();
    const planID = req.params.id;
    const response = await axios.get(`${BASE_URL}/v1/billing/plans/${planID}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    console.log(`✅ PayPal Plan (${planID}):`, response.data);
    res.status(200).json(response.data);
  } catch (error: any) {
    console.error(
      "❌ Error fetching PayPal Plans:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: error.message }); // ✅ Handle errors properly
    return;
  }
};

export const createOrder = async () => {
    
};
