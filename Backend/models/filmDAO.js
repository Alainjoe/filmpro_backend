// Backend/models/filmDAO.js
const db = require('../config/db'); // pool pg

// Liste des colonnes avec alias pour compat frontend
const SELECT_FILMS = `
  SELECT
    id,
    title,
    genre,
    annee_sortie,
    langue_originale,
    pays_productions,
    acteurs,
    realisateurs,
    available_copies,
    "imgPath",
    trailer
  FROM films
`;

class FilmsDAO {

  // ===============================
  // Tous les films
  // ===============================
  static getAllFilms(callback) {
    db.query(`${SELECT_FILMS} ORDER BY id ASC`)
      .then(result => callback(null, result.rows))
      .catch(err => callback(err));
  }

  // ===============================
  // Genres distincts
  // ===============================
  static getAllGenres(callback) {
    const sql = `
      SELECT DISTINCT genre
      FROM films
      WHERE genre IS NOT NULL AND genre <> ''
      ORDER BY genre ASC
    `;

    db.query(sql)
      .then(result => callback(null, result.rows))
      .catch(err => callback(err));
  }

  // ===============================
  // Films populaires
  // ===============================
  static getPopularFilms(callback) {
    const sql = `
      SELECT
        f.id,
        f.title,
        f.genre,
        f.annee_sortie,
        f.langue_originale,
        f.pays_productions,
        f.acteurs,
        f.realisateurs,
        f.available_copies,
        f."imgPath",
        f.trailer,
        COUNT(r.id) AS nb_locations
      FROM films f
      LEFT JOIN rentals r ON f.id = r.film_id
      GROUP BY
        f.id, f.title, f.genre, f.annee_sortie, f.langue_originale, f.pays_productions,
        f.acteurs, f.realisateurs, f.available_copies, f.imgpath, f.trailer
      ORDER BY nb_locations DESC
      LIMIT 10
    `;

    db.query(sql)
      .then(result => callback(null, result.rows))
      .catch(err => callback(err));
  }

  // ===============================
  // Films récents
  // ===============================
  static getRecentFilms(callback) {
    const sql = `
      ${SELECT_FILMS}
      ORDER BY annee_sortie DESC NULLS LAST
      LIMIT 10
    `;

    db.query(sql)
      .then(result => callback(null, result.rows))
      .catch(err => callback(err));
  }

  // Recommandations basées sur les genres déjà loués par l'utilisateur
static getRecommendedFilms(userId, callback) {
  const sql = `
    ${SELECT_FILMS}
    WHERE genre IN (
      SELECT DISTINCT f2.genre
      FROM rentals r
      JOIN films f2 ON r.film_id = f2.id
      WHERE r.user_id = $1
    )
    AND id NOT IN (
      SELECT film_id FROM rentals WHERE user_id = $1
    )
    ORDER BY RANDOM()
    LIMIT 10
  `;

  db.query(sql, [userId])
    .then(result => {
      // Si aucune location → fallback films aléatoires
      if (result.rows.length === 0) {
        return db.query(`${SELECT_FILMS} ORDER BY RANDOM() LIMIT 10`);
      }
      return result;
    })
    .then(result => callback(null, result.rows))
    .catch(err => callback(err));
}

  // ===============================
  // Recherche par filtres
  // ===============================
  static getFilmsByFilters(filters, callback) {
    let sql = `${SELECT_FILMS} WHERE 1=1`;
    const params = [];
    let i = 1;

    if (filters.title) {
      sql += ` AND title ILIKE $${i++}`;
      params.push(`%${filters.title}%`);
    }

    if (filters.name) {
      sql += ` AND (acteurs ILIKE $${i++} OR realisateurs ILIKE $${i++})`;
      params.push(`%${filters.name}%`, `%${filters.name}%`);
    }

    if (filters.genre) {
      sql += ` AND genre ILIKE $${i++}`;
      params.push(`%${filters.genre}%`);
    }

    db.query(sql, params)
      .then(result => callback(null, result.rows))
      .catch(err => callback(err));
  }

  // ===============================
  // Film par ID
  // ===============================
  static getFilmById(id, callback) {
    const sql = `
      ${SELECT_FILMS}
      WHERE id = $1
    `;

    db.query(sql, [id])
      .then(result => callback(null, result.rows[0] || null))
      .catch(err => callback(err));
  }
}

module.exports = FilmsDAO;
