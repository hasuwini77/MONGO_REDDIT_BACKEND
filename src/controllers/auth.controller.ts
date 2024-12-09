// src/controllers/auth.controller.ts
import { type Response, type Request } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/user";
import { AuthRequest } from "../middleware/auth";

export type IconName =
  | "UserCircle"
  | "User"
  | "UserCog"
  | "UserCircle2"
  | "Ghost";

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

    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET!,
      {
        expiresIn: "7d",
      }
    );

    res.status(200).json({
      token,
      refreshToken,
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

export const refreshToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ message: "Refresh token is required" });
      return;
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET!) as {
        userId: string;
      };

      const newToken = jwt.sign(
        { userId: decoded.userId },
        process.env.JWT_SECRET!,
        { expiresIn: "1h" }
      );

      res.json({ token: newToken });
    } catch (error) {
      res.status(401).json({ message: "Invalid refresh token" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
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

// Update PROFILE

export const updateProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { username, iconName } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const updates: { username?: string; iconName?: string } = {};

    if (username) {
      const existingUser = await User.findOne({
        username,
        _id: { $ne: userId },
      });
      if (existingUser) {
        res.status(400).json({ message: "Username already taken" });
        return;
      }
      updates.username = username;
    }

    if (iconName) {
      updates.iconName = iconName;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const userResponse = {
      _id: updatedUser._id?.toString(),
      username: updatedUser.username,
      iconName: updatedUser.iconName as IconName,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };

    res.json({
      message: "Profile updated successfully",
      user: userResponse,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
