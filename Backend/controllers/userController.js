// Backend/controllers/userController.js
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const UserDAO = require("../models/userDAO");
const db = require('../config/db');

// ─── RATE LIMITING (protection brute-force login) ──────────────────────────────
const loginAttempts = new Map();
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOGIN_MAX_ATTEMPTS = 10;

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = loginAttempts.get(ip) || { count: 0, firstAttempt: now };
  if (now - entry.firstAttempt > LOGIN_WINDOW_MS) {
    loginAttempts.set(ip, { count: 1, firstAttempt: now });
    return false;
  }
  entry.count++;
  loginAttempts.set(ip, entry);
  return entry.count > LOGIN_MAX_ATTEMPTS;
}

function resetRateLimit(ip) {
  loginAttempts.delete(ip);
}

// ─── UTILITAIRES ───────────────────────────────────────────────────────────────
function setAuthCookie(res, user) {
  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
  res.cookie("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });
}

function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ success: false, message: "Non connecté." });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Token invalide ou expiré." });
  }
}

// ─── ROUTES ────────────────────────────────────────────────────────────────────

// INSCRIPTION
router.post("/register", (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "Nom, email et mot de passe sont requis.",
    });
  }
  UserDAO.SetInscription({ name, email, password }, (err, result) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "Erreur inscription.",
      });
    }
    return res.status(201).json({
      success: true,
      message: "Inscription réussie.",
      userId: result?.id,
    });
  });
});

// CONNEXION
router.post("/login", (req, res) => {
  const ip = req.ip;
  if (checkRateLimit(ip)) {
    return res.status(429).json({
      success: false,
      message: "Trop de tentatives. Réessayez dans 15 minutes.",
    });
  }

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email et mot de passe sont requis.",
    });
  }
  UserDAO.SetLogin({ email, password }, (err, user) => {
    if (err) {
      console.error("Erreur SetLogin:", err);
      return res.status(500).json({ success: false, message: "Erreur serveur." });
    }
    if (!user) return res.status(401).json({ success: false, message: "Identifiants incorrects." });
    resetRateLimit(ip);
    setAuthCookie(res, user);
    return res.json({
      success: true,
      message: "Connexion réussie.",
      user: { id: user.id, name: user.name, email: user.email },
    });
  });
});

// DÉCONNEXION
router.get("/logout", (_req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });
  return res.json({ success: true, message: "Déconnecté." });
});

// VÉRIFICATION
router.get("/check-session", requireAuth, (req, res) => {
  return res.json({ success: true, user: req.user });
});

// TEST DB (protégé)
router.get("/ping-db", requireAuth, async (_req, res) => {
  try {
    const result = await db.query("SELECT NOW()");
    res.json({ success: true, time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
module.exports.requireAuth = requireAuth;
