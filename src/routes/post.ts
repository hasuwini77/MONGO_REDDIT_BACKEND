import { type Response, type Request, Router, NextFunction } from "express";
import { Post } from "../models/post";
import jwt from "jsonwebtoken";

interface JwtPayload {
  userId: string;
}

interface AuthRequest extends Request {
  user?: {
    _id: string;
  };
}

const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ message: "No token provided" });
      return;
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    req.user = { _id: decoded.userId };
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

export const getPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const posts = await Post.find()
      .populate("author", "username")
      .populate("comments.author", "username")
      .sort({ createdAt: -1 });

    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching posts" });
  }
};

export const getPost = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const post = await Post.findById(id)
      .populate("author", "username")
      .populate("comments.author", "username");

    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ message: "Error fetching post" });
  }
};

export const createPost = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { title, content } = req.body;

    if (!title) {
      res.status(400).json({ message: "Title is required" });
      return;
    }

    if (!req.user) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    const newPost = await Post.create({
      title,
      content,
      author: req.user._id,
      comments: [],
      upvotes: [],
      downvotes: [],
      score: 0,
    });

    await newPost.populate("author", "username");
    res.status(201).json(newPost);
  } catch (error) {
    res.status(500).json({ message: "Error creating post" });
  }
};

export const addComment = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      res.status(400).json({ message: "Comment content is required" });
      return;
    }

    if (!req.user) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    const post = await Post.findById(id);
    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    post.comments.push({
      content,
      author: req.user._id,
    } as any);

    await post.save();
    await post.populate("comments.author", "username");

    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: "Error adding comment" });
  }
};

export const postRouter = Router();

// Routes
postRouter.get("/posts", getPosts);
postRouter.get("/posts/:id", getPost);
postRouter.post("/posts", authMiddleware, createPost);
postRouter.post("/posts/:id/comments", authMiddleware, addComment);
