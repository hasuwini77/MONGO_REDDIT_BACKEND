import { type Response, type Request, Router, NextFunction } from "express";
import { Post } from "../models/post";
import jwt from "jsonwebtoken";
import { updateComment } from "../controllers/auth.controller";
import { Types } from "mongoose";

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

export const votePost = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { postId } = req.params;
    const { voteType } = req.body;

    if (!req.user?._id) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    const userId = new Types.ObjectId(req.user._id);
    const post = await Post.findById(postId);
    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    const hasUpvoted = post.upvotes.some((id) => id.equals(userId));
    const hasDownvoted = post.downvotes.some((id) => id.equals(userId));

    if (voteType === "upvote") {
      if (hasUpvoted) {
        post.upvotes = post.upvotes.filter((id) => !id.equals(userId));
      } else {
        post.upvotes.push(userId);
        post.downvotes = post.downvotes.filter((id) => !id.equals(userId));
      }
    } else if (voteType === "downvote") {
      if (hasDownvoted) {
        post.downvotes = post.downvotes.filter((id) => !id.equals(userId));
      } else {
        post.downvotes.push(userId);
        post.upvotes = post.upvotes.filter((id) => !id.equals(userId));
      }
    }

    await post.save();
    await post.populate("author", "username");

    // Respond with updated counts
    res.status(200).json({
      ...post.toObject(),
      upvotes: post.upvotes.length,
      downvotes: post.downvotes.length,
    });
  } catch (error) {
    console.error(`Error in votePost: `, error);
    res.status(500).json({ message: "Error voting on post" });
  }
};

export const getPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const posts = await Post.find()
      .populate("author", "username")
      .populate("comments.author", "username")
      .sort({ createdAt: -1 });

    // Transform the posts to include vote counts
    const postsWithCounts = posts.map((post) => ({
      ...post.toObject(),
      upvotes: post.upvotes.length,
      downvotes: post.downvotes.length,
      score: post.upvotes.length - post.downvotes.length, // SCORE
    }));

    res.status(200).json(postsWithCounts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching posts" });
  }
};

export const getMyPosts = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const posts = await Post.find({ author: req.user?._id })
      .populate("author", "username")
      .populate("comments.author", "username")
      .sort({ createdAt: -1 });

    res.status(200).json(posts);
  } catch (error) {
    console.error(`Error in getMyPosts: `, error);
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

    // Include vote counts in the response
    const postWithCounts = {
      ...post.toObject(),
      upvotes: post.upvotes.length,
      downvotes: post.downvotes.length,
      score: post.upvotes.length - post.downvotes.length,
    };

    res.status(200).json(postWithCounts);
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

// Delete Post
export const deletePost = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);

    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    if (post.author.toString() !== req.user?._id) {
      res.status(403).json({ message: "Not authorized to delete this post" });
      return;
    }

    await Post.findByIdAndDelete(id);
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting post" });
  }
};

// Update logic
export const updatePost = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    const post = await Post.findById(id);

    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    if (post.author.toString() !== req.user?._id) {
      res.status(403).json({ message: "Not authorized to edit this post" });
      return;
    }

    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { title, content },
      { new: true }
    )
      .populate("author", "username")
      .populate("comments.author", "username");

    res.status(200).json(updatedPost);
  } catch (error) {
    res.status(500).json({ message: "Error updating post" });
  }
};

// Delete Comment logic
export const deleteComment = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { postId, commentId } = req.params;

    if (!req.user) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    const post = await Post.findById(postId);
    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    const comment = post.comments.find(
      (comment) => comment._id.toString() === commentId
    );

    if (!comment) {
      res.status(404).json({ message: "Comment not found" });
      return;
    }

    // Check if user is either the post author or comment author
    const isPostAuthor = post.author.toString() === req.user._id;
    const isCommentAuthor = comment.author.toString() === req.user._id;

    if (!isPostAuthor && !isCommentAuthor) {
      res
        .status(403)
        .json({ message: "Not authorized to delete this comment" });
      return;
    }

    // Use $pull operator to remove the comment
    await Post.updateOne(
      { _id: postId },
      { $pull: { comments: { _id: commentId } } }
    );

    // Fetch the updated post
    const updatedPost = await Post.findById(postId).populate(
      "comments.author",
      "username"
    );

    res.status(200).json(updatedPost);
  } catch (error) {
    res.status(500).json({ message: "Error deleting comment" });
  }
};

export const postRouter = Router();

// Routes
postRouter.get("/posts", getPosts);
postRouter.get("/posts/:id", getPost);
postRouter.get("/my-posts", authMiddleware, getMyPosts);
postRouter.post("/posts", authMiddleware, createPost);
postRouter.post("/posts/:id/comments", authMiddleware, addComment);
postRouter.delete("/posts/:id", authMiddleware, deletePost);
postRouter.put("/posts/:id", authMiddleware, updatePost);
postRouter.delete(
  "/posts/:postId/comments/:commentId",
  authMiddleware,
  deleteComment
);
postRouter.put(
  "/posts/:postId/comments/:commentId",
  authMiddleware,
  updateComment
);
postRouter.post("/posts/:postId/vote", authMiddleware, votePost);
