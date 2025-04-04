import { Router } from "express";
import { getIgHashtags } from "../../controllers/instagram/GetIgHastagsControllers";

const route = Router();

route.post("/api/get/ig/hashtag", getIgHashtags); // Use POST for security

export default route;
