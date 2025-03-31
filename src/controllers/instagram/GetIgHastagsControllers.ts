import { Request, Response } from "express";
import supabase from "../../supabase/supabase";

export const getIgHashtags = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { hashtag } = req.body; // Use req.body for safer POST requests

    if (!hashtag || typeof hashtag !== "string") {
      res
        .status(400)
        .json({ error: "Hashtag is required and must be a string" });
      return;
    }

    const { data, error } = await supabase
      .from("ig_hashtag")
      .select("*")
      .ilike("hashtags", `%${hashtag}%`)
      .limit(20);

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(200).json({
      type: "success",
      data: data,
    });
    return;
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
    return;
  }
};
