export const verifySession: any = async (req: any, res: any) => {
  if (req.user) {
    return res.sendStatus(204)
  } else {
    return res.sendStatus(401)
  }
}

export const verifyAdminSession: any = async (req: any, res: any) => {
  if (req.user && req.user.role === "admin") {
    return res.sendStatus(204)
  } else {
    return res.sendStatus(401)
  }
}