import { Request, Response } from "express";
export const webHook = async (req: Request, res: Response) => {
  try {
    const event = req.body;
    console.log("📌 Webhook Received:", event);

    // ✅ Handle different event types
    if (event.event_type === "BILLING.SUBSCRIPTION.CREATED") {
      console.log("✅ Subscription Created:", event.resource.id);
      // Save subscription details to your database (Supabase)
    } else if (event.event_type === "BILLING.SUBSCRIPTION.ACTIVATED") {
      console.log("✅ Subscription Activated:", event.resource.id);
      // Update user plan in database
    } else if (event.event_type === "BILLING.SUBSCRIPTION.CANCELLED") {
      console.log("❌ Subscription Cancelled:", event.resource.id);
      // Downgrade user or disable pro features
    }
    res.status(200).json({ message: "✅ Webhook received successfully", event });
    return;
  } catch (error) {
    console.error("❌ Webhook Error:", error);
    res.sendStatus(500);
    return;
  }
};
