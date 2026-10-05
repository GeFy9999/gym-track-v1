// Exercise search shared by the session's "add exercise" list and the
// Exercises page. Plain substring matching only found an exercise when its
// catalog name was typed exactly; this matches the way people actually
// search:
//
// - other names for the same exercise, in English and French ("pec deck",
//   "papillon" → Seated Machine Chest Fly; "développé couché" → bench press)
//   and French words for any part of a name ("curl haltère incliné assis")
//   — see exerciseSearchVocabulary.ts
// - words in any order and partial words ("fly pec", "inc db pre")
// - small typos ("bench pres", "lat pulldon")
// - accents, hyphens and spaces ignored ("pullup" = "pull-up" = "pull up")
// - common abbreviations / equipment words (DB, BB, KB, haltère, poulie…)
//
// Results come back ranked: exact name first, then names starting with the
// query, then everything else that matched, closest first.

import {
  ALIAS_RULES,
  PHRASE_SYNONYMS,
  STOPWORDS,
  WORD_SYNONYMS,
} from "./exerciseSearchVocabulary";

export function normalizeSearchText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const compact = (normalized: string) => normalized.replace(/ /g, "");

// Damerau–Levenshtein distance with an early exit once it exceeds `max`.
function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const rows: number[][] = [];
  for (let i = 0; i <= a.length; i++) {
    rows.push([i, ...Array<number>(b.length).fill(0)]);
  }
  for (let j = 0; j <= b.length; j++) rows[0]![j] = j;
  for (let i = 1; i <= a.length; i++) {
    let rowMin = Infinity;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let value = Math.min(
        rows[i - 1]![j]! + 1,
        rows[i]![j - 1]! + 1,
        rows[i - 1]![j - 1]! + cost,
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        value = Math.min(value, rows[i - 2]![j - 2]! + 1);
      }
      rows[i]![j] = value;
      rowMin = Math.min(rowMin, value);
    }
    if (rowMin > max) return max + 1;
  }
  return rows[a.length]![b.length]!;
}

// No typo tolerance under 5 letters: "hack" must not also find "back"/"rack".
const typoAllowance = (word: string) => (word.length >= 8 ? 2 : word.length >= 5 ? 1 : 0);

// How well one query word matches one word of the exercise: 3 = exact,
// 2 = prefix ("dumb" → "dumbbell"), 1 = small typo, 0 = no match.
function wordMatch(query: string, word: string): number {
  if (word === query) return 3;
  if (word.startsWith(query)) return 2;
  const allowance = typoAllowance(query);
  if (allowance === 0) return 0;
  // Compare against the word cut to (about) the query's length too, so a
  // typo in a partly typed word still counts ("dumbel" → "dumbbell").
  const candidates = [word, word.slice(0, query.length), word.slice(0, query.length + 1)];
  return candidates.some((c) => editDistance(query, c, allowance) <= allowance) ? 1 : 0;
}

type IndexedExercise<T> = {
  item: T;
  name: string; // normalized
  nameWords: string[];
  aliasWords: string[];
  compactAll: string; // name + aliases, spaces removed
};

export function buildExerciseSearchIndex<T extends { name: string }>(
  items: T[],
): IndexedExercise<T>[] {
  return items.map((item) => {
    const aliases = ALIAS_RULES.filter((rule) => rule.match.test(item.name)).flatMap(
      (rule) => rule.aliases,
    );
    const name = normalizeSearchText(item.name);
    const aliasText = aliases.map(normalizeSearchText);
    return {
      item,
      name,
      nameWords: name.split(" "),
      aliasWords: aliasText.join(" ").split(" ").filter(Boolean),
      compactAll: [name, ...aliasText].map(compact).join("|"),
    };
  });
}

// How well a query word (or one of its synonyms) matches a single word.
// The catalog reuses the same few hundred words everywhere, so this is
// memoized per query (see searchExercises) — it's what keeps typo matching
// fast enough to run on every keystroke.
function queryWordScore(queryWord: string, word: string): number {
  let best = wordMatch(queryWord, word);
  if (best === 3) return best;
  for (const synonym of WORD_SYNONYMS[queryWord] ?? []) {
    // A synonym is a different word than the one typed: never better than
    // a prefix match of the typed word itself.
    best = Math.max(best, Math.min(wordMatch(synonym, word), 2));
  }
  return best;
}

// Best match of one query word against a word list.
function bestWordScore(
  words: string[],
  scoreOf: (word: string) => number,
): number {
  let best = 0;
  for (const word of words) {
    best = Math.max(best, scoreOf(word));
    if (best === 3) break;
  }
  return best;
}

// French expressions rewritten into the catalog's English, longest first so
// "developpe couche prise serree" wins over "developpe couche".
const PHRASES = Object.entries(PHRASE_SYNONYMS).sort(
  (a, b) => b[0].length - a[0].length,
);

function translatePhrases(normalizedQuery: string): string {
  let text = ` ${normalizedQuery} `;
  for (const [phrase, english] of PHRASES) {
    text = text.split(` ${phrase} `).join(` ${english} `);
  }
  return text.trim();
}

type PreparedQuery = {
  text: string;
  compact: string;
  scorers: ((word: string) => number)[];
};

function prepareQuery(normalizedQuery: string): PreparedQuery {
  const allWords = normalizedQuery.split(" ");
  // Drop filler words ("curl avec haltere", "pull up on bar"), unless
  // that would leave nothing to search for.
  const meaningful = allWords.filter((w) => !STOPWORDS.has(w));
  const words = meaningful.length > 0 ? meaningful : allWords;
  return {
    text: normalizedQuery,
    compact: compact(normalizedQuery),
    scorers: words.map((queryWord) => {
      const cache = new Map<string, number>();
      return (word: string) => {
        let score = cache.get(word);
        if (score === undefined) {
          score = queryWordScore(queryWord, word);
          cache.set(word, score);
        }
        return score;
      };
    }),
  };
}

function scoreEntry<T>(entry: IndexedExercise<T>, query: PreparedQuery): number {
  if (entry.name === query.text) return 1000;
  if (entry.name.startsWith(query.text)) return 900;
  if (entry.name.includes(query.text)) return 800;

  // Each query word against the words of the name and of the aliases.
  const wordCount = query.scorers.length;
  let total = 0;
  let misses = 0;
  for (const scoreOf of query.scorers) {
    const inName = bestWordScore(entry.nameWords, scoreOf);
    const inAlias = bestWordScore(entry.aliasWords, scoreOf);
    // Matching the real name ranks above matching an alias.
    const wordScore = Math.max(inName * 10, inAlias * 8);
    if (wordScore === 0) misses++;
    total += wordScore;
  }
  const average = (total / wordCount) * 20; // at most 600
  if (misses === 0) return average;
  // A longer query may carry one word the exercise's name doesn't have
  // ("curl haltère incliné assis") — still a match, ranked well below.
  if (misses === 1 && wordCount >= 3) return average / 2;

  // Last resort, words typed stuck together: "benchpress", "pecfly".
  if (query.compact.length >= 4 && entry.compactAll.includes(query.compact)) return 300;
  return 0;
}

// Returns the matching items, best match first. An empty query returns
// every item in its original order.
export function searchExercises<T extends { name: string }>(
  index: IndexedExercise<T>[],
  query: string,
): T[] {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return index.map((entry) => entry.item);

  // The query as typed, plus its French expressions translated.
  const translated = translatePhrases(normalizedQuery);
  const queries = [prepareQuery(normalizedQuery)];
  if (translated !== normalizedQuery) queries.push(prepareQuery(translated));

  const scored: { item: T; score: number; name: string }[] = [];
  for (const entry of index) {
    let score = 0;
    for (const prepared of queries) score = Math.max(score, scoreEntry(entry, prepared));
    if (score > 0) scored.push({ item: entry.item, score, name: entry.name });
  }

  // Ties: shorter (more general) names first, then alphabetical.
  scored.sort(
    (a, b) =>
      b.score - a.score || a.name.length - b.name.length || a.name.localeCompare(b.name),
  );
  return scored.map((s) => s.item);
}
