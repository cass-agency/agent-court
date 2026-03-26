import express from "express";
import * as path from "path";
import { loadVerdicts } from "./verdicts";

export function startServer(courtAddress: string, port = 3000): void {
  const app = express();

  app.use(express.static(path.join(process.cwd(), "public")));

  // API: court info
  app.get("/api/court", (_req, res) => {
    res.json({ address: courtAddress });
  });

  // API: verdict history
  app.get("/api/verdicts", (_req, res) => {
    const verdicts = loadVerdicts();
    const list = Object.values(verdicts).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    res.json(list);
  });

  // Serve dashboard for all other routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(process.cwd(), "public", "index.html"));
  });

  app.listen(port, () => {
    console.log(`Dashboard: http://localhost:${port}`);
  });
}
