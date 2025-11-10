const stripAccents = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const collapseWhitespace = (value = '') =>
  stripAccents(value).replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();

const compactValue = (value = '') => stripAccents(value).replace(/[^a-z0-9]+/g, '');

const stripLeadingZeros = (value = '') => value.replace(/\b0+(\d+)/g, '$1');

const prepareArray = (values = []) =>
  values
    .filter((value) => value !== undefined && value !== null)
    .map((value) => String(value).trim())
    .filter(Boolean);

export const buildSearchQuery = (rawInput = '') => {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return null;
  }
  const normalized = collapseWhitespace(trimmed);
  const compact = compactValue(trimmed);
  if (!normalized && !compact) {
    return null;
  }
  return {
    normalized,
    normalizedNoZeros: stripLeadingZeros(normalized),
    compact,
  };
};

export const buildSearchTarget = (values = []) => {
  const prepared = prepareArray(values);
  if (!prepared.length) {
    return {
      normalized: '',
      normalizedNoZeros: '',
      compact: '',
    };
  }
  const joined = prepared.join(' ');
  const normalized = collapseWhitespace(joined);
  return {
    normalized,
    normalizedNoZeros: stripLeadingZeros(normalized),
    compact: compactValue(joined),
  };
};

export const matchesSearchQuery = (values, query) => {
  if (!query) {
    return true;
  }
  const target = buildSearchTarget(values);
  return (
    (query.normalized && target.normalized.includes(query.normalized)) ||
    (query.normalizedNoZeros && target.normalizedNoZeros.includes(query.normalizedNoZeros)) ||
    (query.compact && target.compact.includes(query.compact))
  );
};
