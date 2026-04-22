import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import admin from "firebase-admin";
import cron from "node-cron";

if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    console.log("Firebase Admin initialized successfully.");
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.post("/api/notify", async (req, res) => {
    try {
      const { title, body, tokens } = req.body;
      if (!tokens || tokens.length === 0) return res.status(400).json({ error: "No tokens provided" });
      if (!admin.apps.length) return res.status(500).json({ error: "Firebase Admin not initialized." });

      const message = {
        notification: { title: title || "New Daily Sunshine! ☀️", body: body || "Your room is ready for you today." },
        tokens: tokens,
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      res.json({ success: true, response });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Setup Daily Cron Job at 9:00 AM WAT
  cron.schedule("0 9 * * *", async () => {
    try {
      if (!admin.apps.length) {
        console.warn("Firebase Admin not initialized, cannot run cron job.");
        return;
      }
      
      const db = admin.firestore();
      const dateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' });

      const noteRef = db.collection("daily_notes").doc(dateStr);
      const noteSnap = await noteRef.get();

      if (noteSnap.exists) {
        const usersSnap = await db.collection("users").get();
        const tokens: string[] = [];
        
        usersSnap.forEach(doc => {
          const data = doc.data();
          if (data.fcmToken) {
            tokens.push(data.fcmToken);
          }
        });

        if (tokens.length > 0) {
          const message = {
            notification: { 
              title: "New Daily Sunshine! ☀️", 
              body: "A special message is ready for you today." 
            },
            tokens: tokens,
          };
          
          const response = await admin.messaging().sendEachForMulticast(message);
          console.log("Automated Daily Notification sent for", dateStr, response);
        }
      } else {
        console.log(`No message scheduled for ${dateStr}. No notification sent.`);
      }
    } catch (error) {
      console.error("Error in automated daily notification cron job:", error);
    }
  }, {
    timezone: "Africa/Lagos"
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, "0.0.0.0", () => console.log(`Server running on http://localhost:${PORT}`));
}
startServer();