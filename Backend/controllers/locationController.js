// Backend/controllers/locationController.js
const express = require('express');
const router = express.Router();
const LocationDAO = require('../models/locationDAO');
const { requireAuth } = require('./userController');

// ===================================
// LOUER UN FILM
// ===================================
router.post('/location', requireAuth, (req, res) => {
  const { filmId } = req.body;

  if (!filmId) {
    return res.status(400).json({ success: false, message: "filmId manquant." });
  }

  LocationDAO.LouerFilm(req.user.id, filmId, (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message || "Erreur serveur." });
    }

    const status = (result?.message === "Film loué avec succès") ? 201 : 400;
    return res.status(status).json({ success: status === 201, message: result?.message });
  });
});

// ===================================
// RETOURNER FILM
// ===================================
router.post('/retour', requireAuth, (req, res) => {
  const { filmId } = req.body;

  if (!filmId) {
    return res.status(400).json({ success: false, message: "filmId manquant." });
  }

  LocationDAO.RetournerFilm(req.user.id, filmId, (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message || "Erreur serveur." });
    }

    const ok = (result?.message === "Retour effectué");
    return res.status(ok ? 200 : 400).json({ success: ok, message: result?.message });
  });
});

// ===================================
// MES FILMS LOUÉS
// ===================================
router.get('/mes-films', requireAuth, (req, res) => {
  LocationDAO.ObtenirFilmsLoues(req.user.id, (err, result) => {
    if (err) return res.status(500).json({ success: false, message: err.message || "Erreur serveur." });
    res.json({ success: true, data: result });
  });
});

// ===================================
// VÉRIFIER SI DÉJÀ LOUÉ
// ===================================
router.get('/est-loue/:filmId', requireAuth, (req, res) => {
  LocationDAO.EstFilmDejaLoue(req.user.id, req.params.filmId, (err, isRented) => {
    if (err) return res.status(500).json({ success: false, message: err.message || "Erreur serveur." });
    res.json({ success: true, estLoue: isRented });
  });
});

// ===================================
// COMPTER LOCATIONS
// ===================================
router.get('/compter-locations', requireAuth, (req, res) => {
  LocationDAO.CompterLocationsActives(req.user.id, (err, count) => {
    if (err) return res.status(500).json({ success: false, message: err.message || "Erreur serveur." });
    res.json({ success: true, count });
  });
});

module.exports = router;