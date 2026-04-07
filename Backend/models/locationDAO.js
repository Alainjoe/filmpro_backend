// Backend/models/locationDAO.js
const db = require('../config/db'); // Pool pg

class LocationDAO {

  // ======================================================
  // 1️⃣ LOUER UN FILM
  // ======================================================
  static async LouerFilm(userId, filmId, callback) {
    const client = await db.connect();

    try {
      await client.query('BEGIN');

      // Limite de 5 films (actifs)
      const countRes = await client.query(
        `
        SELECT COUNT(*)::int AS total
        FROM rentals
        WHERE user_id = $1 AND return_date IS NULL
        `,
        [userId]
      );

      if (countRes.rows[0].total >= 5) {
        await client.query('ROLLBACK');
        return callback(null, { message: "Maximum 5 films loués" });
      }

      // Déjà loué ?
      const dupRes = await client.query(
        `
        SELECT id
        FROM rentals
        WHERE user_id = $1 AND film_id = $2 AND return_date IS NULL
        `,
        [userId, filmId]
      );

      if (dupRes.rows.length > 0) {
        await client.query('ROLLBACK');
        return callback(null, { message: "Déjà loué" });
      }

      // Vérifier copies + verrouiller la ligne du film pour éviter course condition
      const copiesRes = await client.query(
        `
        SELECT available_copies
        FROM films
        WHERE id = $1
        FOR UPDATE
        `,
        [filmId]
      );

      if (copiesRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return callback(null, { message: "Film introuvable" });
      }

      if ((copiesRes.rows[0].available_copies ?? 0) <= 0) {
        await client.query('ROLLBACK');
        return callback(null, { message: "Aucune copie disponible" });
      }

      // Décrément copies
      await client.query(
        `
        UPDATE films
        SET available_copies = available_copies - 1
        WHERE id = $1
        `,
        [filmId]
      );

      // Insérer location (Postgres: NOW() ok)
      await client.query(
        `
        INSERT INTO rentals(user_id, film_id, rental_date)
        VALUES ($1, $2, NOW())
        `,
        [userId, filmId]
      );

      await client.query('COMMIT');
      return callback(null, { message: "Film loué avec succès" });

    } catch (err) {
      try { await client.query('ROLLBACK'); } catch (_) {}
      console.error("❌ Erreur LouerFilm:", err);
      return callback({ message: "Erreur création location" });
    } finally {
      client.release();
    }
  }

  // ======================================================
  // 2️⃣ RETOUR
  // ======================================================
  static async RetournerFilm(userId, filmId, callback) {
    const client = await db.connect();

    try {
      await client.query('BEGIN');

      // Trouver location active + verrouiller la ligne rental
      const findRes = await client.query(
        `
        SELECT id
        FROM rentals
        WHERE user_id = $1 AND film_id = $2 AND return_date IS NULL
        FOR UPDATE
        `,
        [userId, filmId]
      );

      if (findRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return callback(null, { message: "Aucun film trouvé" });
      }

      const rentalId = findRes.rows[0].id;

      // Mettre return_date
      await client.query(
        `UPDATE rentals SET return_date = NOW() WHERE id = $1`,
        [rentalId]
      );

      // Rendre copie (verrouiller film aussi)
      await client.query(
        `UPDATE films SET available_copies = available_copies + 1 WHERE id = $1`,
        [filmId]
      );

      await client.query('COMMIT');
      return callback(null, { message: "Retour effectué" });

    } catch (err) {
      try { await client.query('ROLLBACK'); } catch (_) {}
      console.error("❌ Erreur RetournerFilm:", err);
      return callback({ message: "Erreur retour" });
    } finally {
      client.release();
    }
  }

  // ======================================================
  // 3️⃣ FILMS LOUÉS
  // ======================================================
  static ObtenirFilmsLoues(userId, callback) {
  const sql = `
    SELECT 
      f.title, 
      f."imgPath",
      r.rental_date, r.return_date,
      CASE 
        WHEN r.return_date IS NULL THEN 'En cours'
        ELSE 'Retourné'
      END AS statut
    FROM rentals r
    JOIN films f ON f.id = r.film_id
    WHERE r.user_id = $1
    ORDER BY r.rental_date DESC
  `;

  db.query(sql, [userId])
    .then(result => callback(null, result.rows))
    .catch(err => callback(err));
}

  // ======================================================
  // 4️⃣ DÉJÀ LOUÉ ?
  // ======================================================
  static EstFilmDejaLoue(userId, filmId, callback) {
    const sql = `
      SELECT COUNT(*)::int AS rented
      FROM rentals
      WHERE user_id = $1 AND film_id = $2 AND return_date IS NULL
    `;

    db.query(sql, [userId, filmId])
      .then(result => callback(null, result.rows[0].rented > 0))
      .catch(err => callback(err));
  }

  // ======================================================
  // 5️⃣ COMPTER LOCATIONS
  // ======================================================
  static CompterLocationsActives(userId, callback) {
    const sql = `
      SELECT COUNT(*)::int AS total
      FROM rentals
      WHERE user_id = $1 AND return_date IS NULL
    `;

    db.query(sql, [userId])
      .then(result => callback(null, result.rows[0].total))
      .catch(err => callback(err));
  }
}

module.exports = LocationDAO;