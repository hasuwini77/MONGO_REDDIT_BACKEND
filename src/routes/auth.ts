import { Router } from "express";
import {
  getMe,
  logIn,
  refreshToken,
  signUp,
} from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth";

export const authRouter = Router();

authRouter.post("/auth/sign-up", signUp);
authRouter.post("/auth/log-in", logIn);
authRouter.get("/auth/me", authMiddleware, getMe);
authRouter.post("/auth/refresh-token", refreshToken);
