import { Request, Response, Router } from "express";

export const getPosts = async (req: Request, res: Response) => {
  // TODO: get posts from database
  res.status(200).json([{ title: "Hello World!" }, { title: "Hello Dude!" }]);
};

export const getPost = async (req: Request, res: Response) => {
  const { id } = req.params;
  //TODO get posts from database by id

  res.status(200).json({
    title: "Hello World!",
    id,
  });
};

export const postRouter = Router();

postRouter.get("/posts", getPosts);
postRouter.get("/posts/:id", getPost);
