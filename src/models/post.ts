import { type Document, model, Schema, type Types } from "mongoose";

type TComment = Document & {
  content: string;
  author: Types.ObjectId;
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

const commentSchema = new Schema(
  {
    content: {
      type: String,
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

type TPost = Document & {
  title: string;
  content?: string;
  author: Types.ObjectId;
  comments: TComment[];
  upvotes: Types.ObjectId[];
  downvotes: Types.ObjectId[];
  score: number;
  createdAt: Date;
  updatedAt: Date;
};

const postSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    comments: [commentSchema],
    upvotes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    downvotes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    score: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Post = model<TPost>("Post", postSchema);
