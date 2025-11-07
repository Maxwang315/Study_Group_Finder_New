import { Router } from "express";

import {
  createGroup,
  getGroupById,
  getGroups,
  getMyGroups,
  joinGroup,
  leaveGroup,
} from "../controllers/groupController";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.get("/", getGroups);
router.get("/mine", authMiddleware, getMyGroups);
router.post("/", authMiddleware, createGroup);
router.post("/:id/join", authMiddleware, joinGroup);
router.delete("/:id/leave", authMiddleware, leaveGroup);
router.get("/:id", getGroupById);

export default router;
