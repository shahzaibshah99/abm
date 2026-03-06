import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Anthropic from "@anthropic-ai/sdk";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();

// Disable CORS for the entire app
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

app.use(express.json({ limit: '10mb' }));

// API routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "CORS is disabled" });
});

app.post("/api/claude/generate", async (req, res) => {
  const { prompt, system, apiKey } = req.body;
  const key = apiKey || process.env.CLAUDE_API_KEY;
  if (!key) return res.status(401).json({ error: "Claude API Key is missing" });
  const anthropicClient = new Anthropic({ apiKey: key });

  let attempts = 0;
  const maxAttempts = 5;
  const baseDelay = 2000; // 2 seconds

  while (attempts < maxAttempts) {
    try {
      console.log(`Claude request received (Attempt ${attempts + 1}). Using model: claude-sonnet-4-5-20250929`);
      const response = await anthropicClient.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 4000,
        system: system,
        messages: [{ role: "user", content: prompt }],
      });
      
      const content = response.content[0];
      if (content.type === 'text') {
        return res.json({ text: content.text });
      } else {
        console.error("Unexpected Claude response type:", content.type);
        return res.status(500).json({ error: "Unexpected response type from Claude" });
      }
    } catch (error: any) {
      attempts++;
      const isRateLimit = error.status === 429 || error.message?.includes("rate_limit_error") || error.message?.includes("429");
      
      if (isRateLimit && attempts < maxAttempts) {
        const delay = baseDelay * Math.pow(2, attempts - 1) + Math.random() * 1000;
        console.warn(`Claude Rate Limit Hit (429). Retrying in ${Math.round(delay/1000)}s... (Attempt ${attempts}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      console.error("Claude API Error:", error.message);
      return res.status(error.status || 500).json({ error: error.message });
    }
  }
});

app.post("/api/research/tavily", async (req, res) => {
  try {
    const { query, apiKey } = req.body;
    console.log("Tavily search request:", query);
    const key = apiKey || process.env.TAVILY_API_KEY;
    if (!key) return res.status(401).json({ error: "Tavily API Key is missing" });
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: key,
        query,
        search_depth: "advanced",
        include_answer: true,
        max_results: 5
      })
    });
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error("Tavily API Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/research/linkedin/profile", async (req, res) => {
  try {
    const { username, apiKey } = req.body;
    if (!username) return res.status(400).json({ error: "Username is required" });
    
    console.log("LinkedIn Profile request:", username);
    const key = apiKey || process.env.RAPIDAPI_KEY;
    if (!key) return res.status(401).json({ error: "RapidAPI Key is missing" });
    
    const headers = {
      "x-rapidapi-host": "professional-network-data.p.rapidapi.com",
      "x-rapidapi-key": key
    };

    // Get Profile Enrich
    console.log(`Fetching profile for ${username}...`);
    const profileRes = await fetch(`https://professional-network-data.p.rapidapi.com/?username=${username}`, { headers });
    
    if (!profileRes.ok) {
      const err = await profileRes.text();
      console.error(`LinkedIn Profile API Error (${profileRes.status}):`, err);
      return res.status(profileRes.status).json({ error: "LinkedIn Profile API failed", details: err });
    }
    const profileData = await profileRes.json();

    // Get About
    console.log(`Fetching about for ${username}...`);
    const aboutRes = await fetch(`https://professional-network-data.p.rapidapi.com/about-this-profile?username=${username}`, { headers });
    
    if (!aboutRes.ok) {
      console.warn(`LinkedIn About API Warning (${aboutRes.status}):`, await aboutRes.text());
      // Don't fail the whole request if just 'about' fails
      return res.json({ profile: profileData, about: { error: "About section unavailable" } });
    }
    const aboutData = await aboutRes.json();
    
    // Get Posts
    console.log(`Fetching posts for ${username}...`);
    const postsRes = await fetch(`https://professional-network-data.p.rapidapi.com/get-profile-posts?username=${username}`, { headers });
    let postsData = { error: "Posts unavailable" };
    if (postsRes.ok) {
      postsData = await postsRes.json();
    } else {
      console.warn(`LinkedIn Posts API Warning (${postsRes.status}):`, await postsRes.text());
    }

    res.json({ profile: profileData, about: aboutData, posts: postsData });
  } catch (error: any) {
    console.error("LinkedIn Profile API Exception:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/research/linkedin/company", async (req, res) => {
  try {
    const { companyUsername, apiKey } = req.body;
    if (!companyUsername) return res.status(400).json({ error: "Company username is required" });
    
    console.log("LinkedIn Company request:", companyUsername);
    const key = apiKey || process.env.RAPIDAPI_KEY;
    if (!key) return res.status(401).json({ error: "RapidAPI Key is missing" });
    
    const response = await fetch(`https://professional-network-data.p.rapidapi.com/get-company-details?username=${companyUsername}`, {
      headers: {
        "x-rapidapi-host": "professional-network-data.p.rapidapi.com",
        "x-rapidapi-key": key
      }
    });
    
    if (!response.ok) {
      const err = await response.text();
      console.error(`LinkedIn Company API Error (${response.status}):`, err);
      return res.status(response.status).json({ error: "LinkedIn Company API failed", details: err });
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error("LinkedIn Company API Exception:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/email/send", async (req, res) => {
  try {
    const { smtp, to, subject, body } = req.body;
    
    if (!smtp || !smtp.host || !smtp.user || !smtp.pass) {
      return res.status(400).json({ error: "SMTP configuration is incomplete" });
    }

    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: parseInt(smtp.port) || 587,
      secure: smtp.port === "465",
      auth: {
        user: smtp.user,
        pass: smtp.pass,
      },
    });

    const info = await transporter.sendMail({
      from: smtp.from || smtp.user,
      to,
      subject,
      text: body,
      html: body.replace(/\n/g, "<br>"),
    });

    console.log("Email sent: %s", info.messageId);
    res.json({ success: true, messageId: info.messageId });
  } catch (error: any) {
    console.error("Email Sending Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

export default app;
