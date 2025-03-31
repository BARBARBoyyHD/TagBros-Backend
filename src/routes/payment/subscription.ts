import BASE_URL from "../../config/BaseURL";
import { CLIENT_ID, CLIENT_SECRET } from "../../config/Credentials";
import { Request, Response } from "express";
import supabase from "../../supabase/supabase";
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

export const createSubscription = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { user_email } = req.body; // ✅ Get user email from body
    const plan_id = req.params.id; // ✅ Get plan_id from URL param

    // ✅ Step 1: Get PayPal Access Token
    const tokenResponse = await axios.post(
      `${BASE_URL}/v1/oauth2/token`,
      "grant_type=client_credentials",
      {
        auth: {
          username: process.env.PAYPAL_CLIENT_ID!,
          password: process.env.PAYPAL_SECRET!,
        },
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    // ✅ Step 2: Create Subscription in PayPal
    const paypalResponse = await axios.post(
      `${BASE_URL}/v1/billing/subscriptions`,
      {
        plan_id,
        subscriber: { email_address: user_email },
        application_context: {
          return_url: `${process.env.BASE_URL}/complete-payment`,
          cancel_url: `${process.env.BASE_URL}/cancel-payment`,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const subscriptionId = paypalResponse.data.id;

    // ✅ Step 3: Insert Subscription into Supabase
    const { error } = await supabase.from("subscriptions").insert([
      {
        id: subscriptionId,
        user_email,
        plan_id,
        status: "PENDING",
        start_date: new Date().toISOString(),
      },
    ]);

    if (error) throw error;

    res.status(200).json({
      message: "✅ Subscription created",
      subscription_id: subscriptionId,
      approval_url: paypalResponse.data.links.find(
        (l: any) => l.rel === "approve"
      )?.href,
    });
    return;
  } catch (error) {
    console.error("❌ Error creating subscription:", error);
    res.status(500).json({ error: "Subscription creation failed" });
    return;
  }
};
