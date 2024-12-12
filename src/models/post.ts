import { type Document, model, Schema, type Types } from "mongoose";

type TComment = Document & {
  content: string;
  author: Types.ObjectId;
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  upvotes: Types.ObjectId[];
  downvotes: Types.ObjectId[];
  score: number;
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
    upvotes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: [],
      },
    ],
    downvotes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: [],
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

// Add comment pre-save middleware here
commentSchema.pre("save", function (next) {
  if (this.isModified("upvotes") || this.isModified("downvotes")) {
    this.score = this.upvotes.length - this.downvotes.length;
  }
  console.log(`Updated score: ${this.score}`);
  next();
});

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
        default: [],
      },
    ],
    downvotes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: [],
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

postSchema.pre("save", function (next) {
  if (this.isModified("upvotes") || this.isModified("downvotes")) {
    this.score = this.upvotes.length - this.downvotes.length;
  }
  next();
});

export const Post = model<TPost>("Post", postSchema);
