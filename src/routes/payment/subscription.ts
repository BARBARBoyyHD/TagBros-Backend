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

export const fetchSubscriptionDetails = async (subscription_id: string) => {
  try {
    const accessToken = await getAccessToken();

    const response = await axios.get(
      `${BASE_URL}/v1/billing/subscriptions/${subscription_id}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("📌 Subscription Details:", response.data);
    return response.data;
  } catch (error: any) {
    console.error(
      "❌ Error fetching subscription details:",
      error.response?.data || error.message
    );
    throw new Error(error.response?.data?.error_description || error.message);
  }
};

export const createSubscription = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const accessToken = await getAccessToken();
    const { user_email } = req.body;
    const plan_id = req.params.id;

    // ✅ Step 1: Create Subscription in PayPal
    const paypalResponse = await axios.post(
      `${BASE_URL}/v1/billing/subscriptions`,
      {
        plan_id,
        subscriber: { email_address: user_email },
        application_context: {
          return_url: `${BASE_URL}/complete-payment`,
          cancel_url: `${BASE_URL}/cancel-payment`,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const subscription_id = paypalResponse.data.id;

    // ✅ Step 2: Fetch Subscription Details
    const subscriptionDetails = await fetchSubscriptionDetails(subscription_id);

    // ✅ Step 3: Insert Subscription into Supabase
    const { error } = await supabase.from("subscriptions").insert([
      {
        id: subscription_id,
        user_email,
        plan_id,
        status: subscriptionDetails.status || "PENDING",
        start_date: subscriptionDetails.start_time || new Date().toISOString(),
      },
    ]);

    if (error) throw error;

    const approval_url = paypalResponse.data.links.find(
      (l: any) => l.rel === "approve"
    )?.href;

    res.status(200).json({
      message: "✅ Subscription created",
      subscription_id,
      approval_url,
    });

    return;
  } catch (error: any) {
    console.error(
      "❌ Error creating subscription:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Subscription creation failed" });
    return;
  }
};

export const activateSubscription = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { subscription_id } = req.body;

    if (!subscription_id) {
      res.status(400).json({ error: "Subscription ID is required" });
      return;
    }

    // ✅ Get PayPal Access Token
    const accessToken = await getAccessToken();

    // ✅ Fetch Subscription Details
    const response = await axios.get(
      `${BASE_URL}/v1/billing/subscriptions/${subscription_id}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const subscription = response.data;
    console.log("✅ Subscription Details:", subscription);

    // ✅ Check if the subscription is still in "APPROVAL_PENDING"
    if (subscription.status === "APPROVAL_PENDING") {
      // ✅ Activate the subscription
      await axios.post(
        `${BASE_URL}/v1/billing/subscriptions/${subscription_id}/activate`,
        { reason: "User approved the subscription." },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ Subscription activated:", subscription_id);
    }

    // ✅ Save to database
    const { error } = await supabase
      .from("subscriptions")
      .update({ status: "ACTIVE" })
      .eq("id", subscription_id);

    if (error) throw error;

    res.status(200).json({ message: "✅ Subscription activated" });
    return;
  } catch (error: any) {
    console.error(
      "❌ Error activating subscription:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to activate subscription" });
    return;
  }
};
