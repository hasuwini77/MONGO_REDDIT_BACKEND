import express from "express";
import mongoose from "mongoose";
import "dotenv/config";
import cors from "cors";

import { postRouter } from "./routes/post";
import { authRouter } from "./routes/auth";

const app = express();

// Use the imported cors middleware
app.use(
  cors({
    origin: "http://localhost:3000", // Your frontend URL
    credentials: true,
  })
);

app.use(express.json());

app.use(postRouter);
app.use(authRouter);

mongoose
  .connect(process.env.DB_URL!)
  .then(() => {
    const port = process.env.PORT || 8082;
    app.listen(port, () => {
      console.log(`listening on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });

app.get("/", (req, res) => {
  res.send("Hello World!");
});
