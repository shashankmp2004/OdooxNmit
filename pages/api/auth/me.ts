import { requireAuth } from "@/lib/auth";

export default requireAuth(async (req, res) => {
  if (req.method === "GET") {
    return res.status(200).json({
      message: "Authenticated successfully",
      user: req.user
    });
  }

  res.setHeader("Allow", ["GET"]);
  res.status(405).end();
});