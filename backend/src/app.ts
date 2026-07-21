import express from "express";
import { Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import cors from 'cors';
import { router } from "./router";

const app = express();
const port = 8080;

//raw requests are now usable properties on req.body
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.set("trust proxy", true); 

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://10.105.149.112:3000",
      "https://play.pointtaken.social",
      ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : []),
    ],
    credentials: true,
    methods: ["GET", "HEAD", "OPTIONS", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "X-Study-Pid",
    ],
  })
);

app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).send('OK');
});

app.use(cookieParser());

declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; name: string, role: string };
    }
  }
}

app.use("/api", router);
export default app