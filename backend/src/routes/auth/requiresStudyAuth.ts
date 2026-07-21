import { Request, Response, NextFunction } from "express";

export const requiresStudyAuth: any = (req: Request, res: Response, next: NextFunction): void => {
  const pid = (req.headers["x-study-pid"] as string | undefined)
    || req.body?.studyPid
    || (req.query?.studyPid as string | undefined);
  if (!pid || !pid.trim()) {
    res.status(401).json({ message: "Missing study participant ID" });
    return;
  }
  req.user = { userId: pid.trim(), name: "Participant", role: "user" };
  next();
};
