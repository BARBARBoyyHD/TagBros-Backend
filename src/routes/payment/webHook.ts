import supabase from "../../supabase/supabase";
import { Request, Response } from "express";
import { createSubscription } from "./subscription";
export const webHook = async (req: Request, res: Response) => {
  try {
    const event: any = req.body;
    const subsResult = createSubscription(req,res)

    console.log("📌 Webhook Event Received:", JSON.stringify(event, null, 2));

    if (event.event_type === "BILLING.SUBSCRIPTION.ACTIVATED") {
      const subscriptionId = event.resource.id;
      console.log(`🔄 Updating Subscription ID: ${subscriptionId}`);

      // ✅ Update Subscription Status in Supabase
      const { data, error } = await supabase
        .from("subscriptions")
        .update({ status: "ACTIVE" })
        .eq("id", subscriptionId)
        .select(); // ✅ Add `.select()` to debug response

      if (error) {
        console.error("❌ Supabase Update Error:", error);
        throw error;
      }

      console.log("✅ Supabase Update Success:", data);
    }

    res.status(200).json({ message: "✅ Webhook received successfully",data:subsResult });
  } catch (error) {
    console.error("❌ Webhook Error:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
};
