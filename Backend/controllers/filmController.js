// Backend/controllers/filmController.js
const express = require('express');
const router = express.Router();
const FilmsDAO = require('../models/filmDAO');
const { requireAuth } = require('./userController');

// ===================================
// FONCTION DE MAPPING (TRÈS IMPORTANT)
// ===================================
function mapFilm(film) {
  return {
    id: film.id,
    title: film.title || film.realisateurs || "Titre inconnu",
    imgPath: film.imgPath || null,
    available_copies: film.available_copies || 0,
    genre: film.genre || "",
    realisateurs: film.realisateurs || "Inconnu",
    annee_sortie: film.annee_sortie || null,
    trailer: film.trailer || null
  };
}

// ===================================
// LISTE + FILTRES
// ===================================
router.get('/', requireAuth, (req, res) => {
  const { title, name, genre } = req.query;

  FilmsDAO.getFilmsByFilters({ title, name, genre }, (err, results) => {
    if (err) {
      console.error("Erreur films:", err);
      return res.status(500).json({ success: false, message: "Erreur serveur films." });
    }

    const films = results.map(mapFilm);
    res.json({ success: true, data: films });
  });
});

// ===================================
// GENRES
// ===================================
router.get('/metadata/genres', requireAuth, (req, res) => {
  FilmsDAO.getAllGenres((err, results) => {
    if (err) {
      console.error("Erreur genres:", err);
      return res.status(500).json({ success: false, message: "Erreur chargement genres." });
    }

    res.json({ success: true, data: results.map(g => g.genre) });
  });
});

// ===================================
// POPULAIRES
// ===================================
router.get('/popular', requireAuth, (req, res) => {
  FilmsDAO.getPopularFilms((err, results) => {
    if (err) {
      console.error("Erreur populaires:", err);
      return res.status(500).json({ success: false, message: "Erreur chargement populaires." });
    }

    const films = results.map(mapFilm);
    res.json({ success: true, data: films });
  });
});

// ===================================
// RÉCENTS
// ===================================
router.get('/recent', requireAuth, (req, res) => {
  FilmsDAO.getRecentFilms((err, results) => {
    if (err) {
      console.error("Erreur récents:", err);
      return res.status(500).json({ success: false, message: "Erreur chargement récents." });
    }

    const films = results.map(mapFilm);
    res.json({ success: true, data: films });
  });
});

// ===================================
// RECOMMANDÉS
// ===================================
router.get('/recommended', requireAuth, (req, res) => {
  FilmsDAO.getRecommendedFilms(req.user.id, (err, results) => {
    if (err) {
      console.error("Erreur recommandés:", err);
      return res.status(500).json({ success: false, message: "Erreur chargement recommandés." });
    }

    const films = results.map(mapFilm);
    res.json({ success: true, data: films });
  });
});

// ===================================
// RECHERCHE
// ===================================
router.get('/search', requireAuth, (req, res) => {
  const { title, name, genre } = req.query;

  FilmsDAO.getFilmsByFilters({ title, name, genre }, (err, results) => {
    if (err) {
      console.error("Erreur recherche:", err);
      return res.status(500).json({ success: false, message: "Erreur recherche." });
    }

    const films = results.map(mapFilm);
    res.json({ success: true, data: films });
  });
});

// ===================================
// FILM PAR ID
// ===================================
router.get('/:id', requireAuth, (req, res) => {
  FilmsDAO.getFilmById(req.params.id, (err, film) => {
    if (err) {
      console.error("Erreur film ID:", err);
      return res.status(500).json({ success: false, message: "Erreur serveur." });
    }

    if (!film) {
      return res.status(404).json({ success: false, message: "Film non trouvé." });
    }

    res.json({ success: true, data: mapFilm(film) });
  });
});

module.exports = router;
