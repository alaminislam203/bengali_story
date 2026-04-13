import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, orderBy } from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Load Firebase Config
  const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
  const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));

  // Initialize Firebase for server-side use
  const firebaseApp = initializeApp(firebaseConfig);
  const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

  // Sitemap Route
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const baseUrl = process.env.APP_URL || `https://${req.get('host')}`;
      
      // Fetch published posts
      const postsRef = collection(db, 'posts');
      const q = query(postsRef, where('status', '==', 'published'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const posts = querySnapshot.docs.map(doc => ({
        slug: doc.data().slug,
        updatedAt: doc.data().updatedAt?.toDate ? doc.data().updatedAt.toDate() : new Date()
      }));

      // Fetch static pages
      const pagesRef = collection(db, 'pages');
      const pagesSnapshot = await getDocs(query(pagesRef, where('status', '==', 'published')));
      const pages = pagesSnapshot.docs.map(doc => ({
        slug: doc.data().slug,
        updatedAt: doc.data().updatedAt?.toDate ? doc.data().updatedAt.toDate() : new Date()
      }));

      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/blog</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;

      // Add posts
      posts.forEach(post => {
        xml += `
  <url>
    <loc>${baseUrl}/post/${post.slug}</loc>
    <lastmod>${post.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
      });

      // Add pages
      pages.forEach(page => {
        xml += `
  <url>
    <loc>${baseUrl}/static/${page.slug}</loc>
    <lastmod>${page.updatedAt.toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`;
      });

      xml += `\n</urlset>`;

      res.header('Content-Type', 'application/xml');
      res.send(xml);
    } catch (error) {
      console.error("Sitemap error:", error);
      res.status(500).send("Error generating sitemap");
    }
  });

  // Robots.txt Route
  app.get("/robots.txt", (req, res) => {
    const baseUrl = process.env.APP_URL || `https://${req.get('host')}`;
    const robots = `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml`;
    res.header('Content-Type', 'text/plain');
    res.send(robots);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
