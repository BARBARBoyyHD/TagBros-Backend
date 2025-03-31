import supabase from "../../supabase/supabase";
import { Request, Response } from "express";
export const webHook = async (req: Request, res: Response) => {
  try {
    const event: any = req.body;

    if (event.event_type === "BILLING.SUBSCRIPTION.ACTIVATED") {
      const subscriptionId = event.resource.id;

      // ✅ Update Subscription Status in Supabase
      const { error } = await supabase
        .from("subscriptions")
        .update({ status: "ACTIVE" })
        .eq("id", subscriptionId);

      if (error) throw error;
    }

    res.status(200).json({ message: "✅ Webhook received successfully" });
    return
  } catch (error) {
    console.error("❌ Webhook Error:", error);
    res.status(500).json({ error: "Webhook processing failed" });
    return
  }
};
