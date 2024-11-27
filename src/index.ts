import express from "express";
import mongoose from "mongoose";
import "dotenv/config";

import { postRouter } from "./routes/post";

const app = express();

app.use(postRouter);

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
