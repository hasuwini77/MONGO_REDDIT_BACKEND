// src/controllers/auth.controller.ts
import { type Response, type Request } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/user";
import { AuthRequest } from "../middleware/auth";

export const signUp = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ message: "missing username or password" });
      return;
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      res.status(400).json({ message: "username taken" });
      return;
    }

    const user = new User({ username, password });
    await user.save();

    res.status(201).json({ message: "successfully signed up user" });
  } catch (error) {
    console.error(error);
    res.status(500).send();
  }
};

export const logIn = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ message: "missing username or password" });
      return;
    }

    const user = await User.findOne({ username }, "+password");
    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(400).json({ message: "wrong username or password" });
      return;
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, {
      expiresIn: "1h",
    });

    res.status(200).json({
      token,
      user: {
        id: user._id,
        username: user.username,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).send();
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?._id).select("-password");
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.json({
      id: user._id,
      username: user.username,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
