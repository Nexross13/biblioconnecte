const { query } = require('../config/db');

// Map common accented characters plus combining marks to ASCII equivalents for fuzzy search.
const ACCENT_MAP = [
  ['à', 'a'],
  ['á', 'a'],
  ['â', 'a'],
  ['ä', 'a'],
  ['ã', 'a'],
  ['å', 'a'],
  ['ç', 'c'],
  ['è', 'e'],
  ['é', 'e'],
  ['ê', 'e'],
  ['ë', 'e'],
  ['ì', 'i'],
  ['í', 'i'],
  ['î', 'i'],
  ['ï', 'i'],
  ['ñ', 'n'],
  ['ò', 'o'],
  ['ó', 'o'],
  ['ô', 'o'],
  ['ö', 'o'],
  ['õ', 'o'],
  ['ù', 'u'],
  ['ú', 'u'],
  ['û', 'u'],
  ['ü', 'u'],
  ['ý', 'y'],
  ['ÿ', 'y'],
  ['À', 'a'],
  ['Á', 'a'],
  ['Â', 'a'],
  ['Ä', 'a'],
  ['Ã', 'a'],
  ['Å', 'a'],
  ['Ç', 'c'],
  ['È', 'e'],
  ['É', 'e'],
  ['Ê', 'e'],
  ['Ë', 'e'],
  ['Ì', 'i'],
  ['Í', 'i'],
  ['Î', 'i'],
  ['Ï', 'i'],
  ['Ñ', 'n'],
  ['Ò', 'o'],
  ['Ó', 'o'],
  ['Ô', 'o'],
  ['Ö', 'o'],
  ['Õ', 'o'],
  ['Ù', 'u'],
  ['Ú', 'u'],
  ['Û', 'u'],
  ['Ü', 'u'],
  ['Ý', 'y'],
  ['Ÿ', 'y'],
  ['’', "'"],
  ['‘', "'"],
  ['`', "'"],
  ['´', "'"],
];

const BASE_ACCENT_FROM = ACCENT_MAP.map(([source]) => source).join('');
const ACCENT_TO = ACCENT_MAP.map(([, target]) => target).join('');
const COMBINING_MARKS = Array.from({ length: 0x36f - 0x300 + 1 }, (_, index) =>
  String.fromCharCode(0x0300 + index),
).join('');
const ACCENT_FROM = `${BASE_ACCENT_FROM}${COMBINING_MARKS}`;
const ACCENT_TO_SQL = ACCENT_TO.replace(/'/g, "''");

const normalizeForSearch = (value = '') => {
  const normalized = String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’‘`´]/g, "'")
    .toLowerCase();

  return normalized.replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
};

const normalizeColumnExpression = (column) => {
  const translated = `TRANSLATE(LOWER(${column}), '${ACCENT_FROM}', '${ACCENT_TO_SQL}')`;
  return `TRIM(BOTH ' ' FROM REGEXP_REPLACE(REGEXP_REPLACE(${translated}, '[^a-z0-9]+', ' ', 'g'), '[[:space:]]+', ' ', 'g'))`;
};

const normalizeDate = (value) => {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  const stringValue = String(value);
  if (!stringValue.length) {
    return null;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(stringValue)) {
    return stringValue.slice(0, 10);
  }
  const parsed = new Date(stringValue);
  if (Number.isNaN(parsed.getTime())) {
    return stringValue;
  }
  return parsed.toISOString().slice(0, 10);
};

const mapBook = (row) =>
  row && {
    id: row.id,
    title: row.title,
    isbn: row.isbn,
    edition: row.edition,
    volume: row.volume,
    volumeTitle: row.volume_title || null,
    releaseDate: normalizeDate(row.publication_date),
    summary: row.summary,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    averageRating:
      row.average_rating !== null && row.average_rating !== undefined
        ? Number(row.average_rating)
        : null,
    reviewCount:
      row.review_count !== null && row.review_count !== undefined ? Number(row.review_count) : 0,
  };

const listBooks = async ({ search, limit = 25, offset = 0 } = {}) => {
  const values = [];
  const conditions = [];

  if (search) {
    const normalizedSearch = normalizeForSearch(search);
    if (normalizedSearch) {
      const likePattern = `%${normalizedSearch.replace(/ /g, '%')}%`;
      values.push(likePattern);
      const normalizedTitleExpr = normalizeColumnExpression("COALESCE(b.title, '')");
      const normalizedSummaryExpr = normalizeColumnExpression("COALESCE(b.summary, '')");
      conditions.push(
        `(${normalizedTitleExpr} LIKE $${values.length} OR ${normalizedSummaryExpr} LIKE $${values.length})`,
      );
    }
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  values.push(limit, offset);

  const result = await query(
    `SELECT b.id,
            b.title,
            b.isbn,
            b.edition,
            b.volume,
            b.volume_title,
            b.publication_date,
            b.summary,
            b.created_at,
            b.updated_at,
            AVG(r.rating)::numeric(10,2) AS average_rating,
            COUNT(r.id) AS review_count
     FROM books b
     LEFT JOIN reviews r ON r.book_id = b.id
     ${whereClause}
     GROUP BY b.id, b.title, b.isbn, b.edition, b.volume, b.volume_title, b.publication_date, b.summary, b.created_at, b.updated_at
     ORDER BY b.created_at DESC
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values,
  );

  return result.rows.map(mapBook);
};

const findById = async (id) => {
  const result = await query(
    `SELECT b.id,
            b.title,
            b.isbn,
            b.edition,
            b.volume,
            b.volume_title,
            b.publication_date,
            b.summary,
            b.created_at,
            b.updated_at,
            AVG(r.rating)::numeric(10,2) AS average_rating,
            COUNT(r.id) AS review_count
     FROM books b
     LEFT JOIN reviews r ON r.book_id = b.id
     WHERE b.id = $1
     GROUP BY b.id, b.title, b.isbn, b.edition, b.volume, b.volume_title, b.publication_date, b.summary, b.created_at, b.updated_at`,
    [id],
  );
  return mapBook(result.rows[0]);
};

const createBook = async ({
  title,
  isbn,
  edition,
  volume,
  volumeTitle,
  releaseDate = null,
  summary,
}) => {
  const result = await query(
    `INSERT INTO books (title, isbn, edition, volume, volume_title, publication_date, summary)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, title, isbn, edition, volume, volume_title, publication_date, summary, created_at, updated_at`,
    [title, isbn, edition, volume, volumeTitle, releaseDate, summary],
  );
  return mapBook(result.rows[0]);
};

const updateBook = async (
  id,
  { title, isbn, edition, volume, volumeTitle, releaseDate, summary },
) => {
  const result = await query(
    `UPDATE books
     SET title = $2,
         isbn = $3,
         edition = $4,
         volume = $5,
         volume_title = $6,
         publication_date = $7,
         summary = $8,
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, title, isbn, edition, volume, volume_title, publication_date, summary, created_at, updated_at`,
    [id, title, isbn, edition, volume, volumeTitle, releaseDate, summary],
  );
  return mapBook(result.rows[0]);
};

const deleteBook = async (id) => {
  const result = await query(`DELETE FROM books WHERE id = $1 RETURNING id`, [id]);
  return result.rows[0];
};

const getBookAuthors = async (bookId) => {
  const result = await query(
    `SELECT a.id, a.first_name, a.last_name, a.biography
     FROM book_authors ba
     JOIN authors a ON a.id = ba.author_id
     WHERE ba.book_id = $1
     ORDER BY a.last_name ASC`,
    [bookId],
  );
  return result.rows.map((row) => ({
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    biography: row.biography,
  }));
};

const getBookGenres = async (bookId) => {
  const result = await query(
    `SELECT g.id, g.name
     FROM book_genres bg
     JOIN genres g ON g.id = bg.genre_id
     WHERE bg.book_id = $1
     ORDER BY g.name ASC`,
    [bookId],
  );
  return result.rows.map((row) => ({ id: row.id, name: row.name }));
};

const getNextVolumeNumberForTitle = async (title) => {
  if (!title) {
    return '1';
  }
  const result = await query(
    `SELECT MAX(CASE WHEN TRIM(volume) ~ '^[0-9]+$' THEN TRIM(volume)::int ELSE NULL END) AS max_numeric_volume
     FROM books
     WHERE LOWER(title) = LOWER($1)`,
    [title],
  );
  const maxVolume = result.rows[0]?.max_numeric_volume;
  if (maxVolume === null || maxVolume === undefined) {
    return '1';
  }
  return String(Number(maxVolume) + 1);
};

const setBookAuthors = async (bookId, authorIds = []) => {
  await query(`DELETE FROM book_authors WHERE book_id = $1`, [bookId]);
  const uniqueAuthorIds = [...new Set(authorIds)];
  if (!uniqueAuthorIds.length) {
    return [];
  }

  const values = uniqueAuthorIds
    .map((_, index) => `($1, $${index + 2})`)
    .join(', ');

  await query(`INSERT INTO book_authors (book_id, author_id) VALUES ${values}`, [
    bookId,
    ...uniqueAuthorIds,
  ]);

  return getBookAuthors(bookId);
};

const setBookGenres = async (bookId, genreIds = []) => {
  await query(`DELETE FROM book_genres WHERE book_id = $1`, [bookId]);
  const uniqueGenreIds = [...new Set(genreIds)];
  if (!uniqueGenreIds.length) {
    return [];
  }

  const values = uniqueGenreIds
    .map((_, index) => `($1, $${index + 2})`)
    .join(', ');

  await query(`INSERT INTO book_genres (book_id, genre_id) VALUES ${values}`, [
    bookId,
    ...uniqueGenreIds,
  ]);

  return getBookGenres(bookId);
};

module.exports = {
  listBooks,
  findById,
  createBook,
  updateBook,
  deleteBook,
  getBookAuthors,
  getBookGenres,
  getNextVolumeNumberForTitle,
  setBookAuthors,
  setBookGenres,
};
