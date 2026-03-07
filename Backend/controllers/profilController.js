// Backend/controllers/profilController.js
const express = require('express');
const router = express.Router();
const ProfilDAO = require('../models/profilDAO');
const { requireAuth } = require('./userController');

// ===================================
// PROFIL
// ===================================
router.get('/', requireAuth, (req, res) => {
  ProfilDAO.getUserProfile(req.user.id, (err, result) => {
    if (err) return res.status(500).json({ success: false, message: "Erreur profil." });
    if (!result) return res.status(404).json({ success: false, message: "Utilisateur introuvable." });
    res.json({ success: true, data: result });
  });
});

// ===================================
// MES FILMS
// ===================================
router.get('/mesfilms', requireAuth, (req, res) => {
  ProfilDAO.getUserRentals(req.user.id, (err, result) => {
    if (err) return res.status(500).json({ success: false, message: "Erreur films loués." });
    res.json({ success: true, data: result });
  });
});

// ===================================
// UPDATE MOT DE PASSE
// ===================================
router.put('/password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: "Champs manquants." });
  }
  ProfilDAO.updatePasswordWithVerification(
    req.user.id,
    currentPassword,
    newPassword,
    (err, result) => {
      if (err) return res.status(400).json({ success: false, message: err.message });
      res.json({ success: true, message: result.message });
    }
  );
});

// ===================================
// UPDATE PROFIL
// ===================================
router.put('/', requireAuth, (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ success: false, message: "Nom et email requis." });
  }
  ProfilDAO.updateProfile(req.user.id, { name, email }, (err, result) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    res.json({ success: true, message: result.message });
  });
});

// ===================================
// SUPPRESSION COMPTE
// ===================================
router.delete('/delete', requireAuth, (req, res) => {
  ProfilDAO.deleteAccount(req.user.id, (err, result) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    res.clearCookie("token", {
      httpOnly: true,
      secure: true,      // ✅ identique à setAuthCookie
      sameSite: "none",  // ✅ identique à setAuthCookie
    });
    res.json({ success: true, message: result.message });
  });
});

module.exports = router;
