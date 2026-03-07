// Backend/controllers/filmController.js
const express = require('express');
const router = express.Router();
const FilmsDAO = require('../models/filmDAO');
const { requireAuth } = require('./userController');

// ===================================
// LISTE + FILTRES
// ===================================
router.get('/', requireAuth, (req, res) => {
  const { title, name, genre } = req.query;

  FilmsDAO.getFilmsByFilters({ title, name, genre }, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: "Erreur serveur films." });
    res.json({ success: true, data: results });
  });
});

// ===================================
// GENRES
// ===================================
router.get('/metadata/genres', requireAuth, (req, res) => {
  FilmsDAO.getAllGenres((err, results) => {
    if (err) return res.status(500).json({ success: false, message: "Erreur chargement genres." });
    res.json({ success: true, data: results.map(g => g.genre) });
  });
});

// ===================================
// POPULAIRES
// ===================================
router.get('/popular', requireAuth, (req, res) => {
  FilmsDAO.getPopularFilms((err, results) => {
    if (err) return res.status(500).json({ success: false, message: "Erreur chargement populaires." });
    res.json({ success: true, data: results });
  });
});

// ===================================
// RÉCENTS
// ===================================
router.get('/recent', requireAuth, (req, res) => {
  FilmsDAO.getRecentFilms((err, results) => {
    if (err) return res.status(500).json({ success: false, message: "Erreur chargement récents." });
    res.json({ success: true, data: results });
  });
});

// ===================================
// RECOMMANDÉS
// ===================================
router.get('/recommended', requireAuth, (req, res) => {
  FilmsDAO.getRecommendedFilms(req.user.id, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: "Erreur chargement recommandés." });
    res.json({ success: true, data: results });
  });
});

// ===================================
// RECHERCHE
// ===================================
router.get('/search', requireAuth, (req, res) => {
  const { title, name, genre } = req.query;

  FilmsDAO.getFilmsByFilters({ title, name, genre }, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: "Erreur recherche." });
    res.json({ success: true, data: results });
  });
});

// ===================================
// FILM PAR ID  ← doit rester EN DERNIER
// ===================================
router.get('/:id', requireAuth, (req, res) => {
  FilmsDAO.getFilmById(req.params.id, (err, film) => {
    if (err) return res.status(500).json({ success: false, message: "Erreur serveur." });

    if (!film) {
      return res.status(404).json({ success: false, message: "Film non trouvé." });
    }

    res.json({ success: true, data: film });
  });
});

module.exports = router;