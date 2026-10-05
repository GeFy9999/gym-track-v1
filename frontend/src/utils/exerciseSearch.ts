// Exercise search shared by the session's "add exercise" list and the
// Exercises page. Plain substring matching only found an exercise when its
// catalog name was typed exactly; this matches the way people actually
// search:
//
// - other names for the same exercise, in English and French ("pec deck",
//   "papillon" → Seated Machine Chest Fly; "développé couché" → bench press)
// - words in any order and partial words ("fly pec", "inc db pre")
// - small typos ("bench pres", "lat pulldon")
// - accents, hyphens and spaces ignored ("pullup" = "pull-up" = "pull up")
// - common abbreviations / equipment words (DB, BB, KB, haltère, poulie…)
//
// Results come back ranked: exact name first, then names starting with the
// query, then everything else that matched, closest first.

// Other names an exercise is known by, attached to every catalog exercise
// whose name matches `match`. Keyed on name patterns (not ids) so they keep
// applying to custom exercises and to any later catalog rename.
const ALIAS_RULES: { match: RegExp; aliases: string[] }[] = [
  {
    match: /machine.*chest fly|pec deck/i,
    aliases: ["pec deck", "pec dec", "peck deck", "pec fly", "pecfly", "butterfly", "papillon", "écarté machine", "fly machine"],
  },
  {
    match: /machine.*reverse fly|reverse.*pec deck/i,
    aliases: ["reverse pec deck", "reverse butterfly", "oiseau machine", "rear delt machine"],
  },
  {
    match: /cable.*fly|crossover/i,
    aliases: ["cable crossover", "vis à vis", "poulie vis à vis", "écarté poulie", "cable fly"],
  },
  { match: /dumbbell.*(chest )?fly/i, aliases: ["écarté haltères", "écarté couché"] },
  {
    match: /lat pulldown|cable.*pulldown|machine.*pulldown/i,
    aliases: ["tirage vertical", "tirage poitrine", "tirage nuque", "lat pull down", "pulldown"],
  },
  {
    match: /seated.*(cable|machine).*row|cable.*seated.*row|low.*row/i,
    aliases: ["tirage horizontal", "rowing assis", "seated row", "low row", "tirage assis"],
  },
  { match: /t-bar row/i, aliases: ["rowing t", "t bar row", "tbar"] },
  { match: /bent-over.*row|barbell.*row/i, aliases: ["rowing barre", "rowing buste penché", "barbell row"] },
  { match: /dumbbell.*row/i, aliases: ["rowing haltère", "rowing unilatéral"] },
  { match: /upright row/i, aliases: ["tirage menton", "rowing menton"] },
  { match: /leg press|sled.*press/i, aliases: ["presse", "presse à cuisses", "presse jambes", "presse inclinée"] },
  { match: /leg extension/i, aliases: ["leg extension", "extension jambes", "extension quadriceps", "leg ext"] },
  { match: /leg curl/i, aliases: ["leg curl", "ischios machine", "curl ischios", "hamstring curl"] },
  { match: /hack squat/i, aliases: ["hack", "hack squat"] },
  { match: /split squat|rear-foot/i, aliases: ["squat bulgare", "fente bulgare", "bulgarian split squat"] },
  { match: /machine chest press|chest press/i, aliases: ["développé machine", "presse pectoraux", "chest press"] },
  {
    match: /bench press/i,
    aliases: ["développé couché", "dc", "bench", "bench press"],
  },
  { match: /incline.*(bench )?press/i, aliases: ["développé incliné"] },
  { match: /decline.*(bench )?press/i, aliases: ["développé décliné"] },
  {
    match: /overhead press|shoulder press|military press/i,
    aliases: ["développé militaire", "développé épaules", "développé nuque", "ohp", "military press", "shoulder press"],
  },
  { match: /arnold/i, aliases: ["développé arnold"] },
  { match: /lateral raise/i, aliases: ["élévation latérale", "élévations latérales", "lat raise", "side raise"] },
  { match: /front raise/i, aliases: ["élévation frontale", "élévations frontales"] },
  { match: /reverse fly|rear.delt/i, aliases: ["oiseau", "rear delt", "arrière d'épaule", "deltoïde postérieur"] },
  { match: /face pull/i, aliases: ["face pull", "tirage visage"] },
  { match: /shrug/i, aliases: ["haussement d'épaules", "haussements d'épaules", "shrugs"] },
  {
    match: /pushdown/i,
    aliases: ["extension triceps poulie", "triceps poulie", "push down", "pushdown"],
  },
  {
    match: /skull crusher|lying.*triceps extension/i,
    aliases: ["barre au front", "skull crusher", "skullcrusher", "extension triceps allongé"],
  },
  {
    match: /overhead.*triceps extension|triceps.*overhead/i,
    aliases: ["extension triceps nuque", "extension verticale", "french press"],
  },
  { match: /kickback/i, aliases: ["kickback", "extension triceps penché"] },
  { match: /\bdip\b/i, aliases: ["dips", "dip"] },
  { match: /preacher/i, aliases: ["curl pupitre", "pupitre", "larry scott", "preacher curl"] },
  { match: /hammer curl/i, aliases: ["curl marteau", "hammer curl"] },
  { match: /concentration curl/i, aliases: ["curl concentré", "curl concentration"] },
  { match: /wrist curl/i, aliases: ["curl poignet", "flexion poignets"] },
  { match: /romanian deadlift/i, aliases: ["rdl", "soulevé de terre roumain", "sdt roumain"] },
  { match: /stiff.?leg.*deadlift/i, aliases: ["soulevé de terre jambes tendues", "sldl"] },
  { match: /deadlift/i, aliases: ["soulevé de terre", "sdt"] },
  { match: /good morning/i, aliases: ["good morning", "bonjour"] },
  { match: /hip thrust|glute bridge/i, aliases: ["hip thrust", "pont fessier", "relevé de bassin"] },
  { match: /calf raise|calf press/i, aliases: ["mollets", "extension mollets", "calf raise"] },
  { match: /hip abduction/i, aliases: ["abducteurs", "machine abducteurs", "abductor"] },
  { match: /hip adduction/i, aliases: ["adducteurs", "machine adducteurs", "adductor"] },
  { match: /lunge/i, aliases: ["fente", "fentes"] },
  { match: /pull-up/i, aliases: ["traction", "tractions", "pullup"] },
  { match: /chin-up/i, aliases: ["traction supination", "tractions supination", "chinup"] },
  { match: /push-up/i, aliases: ["pompe", "pompes", "pushup"] },
  { match: /plank/i, aliases: ["gainage", "planche"] },
  { match: /crunch/i, aliases: ["abdos", "crunch"] },
  { match: /leg raise|knee raise/i, aliases: ["relevé de jambes", "relevé de genoux"] },
  { match: /russian twist/i, aliases: ["rotation russe", "russian twist"] },
  { match: /rollout|ab wheel/i, aliases: ["roue abdominale", "ab wheel", "roulette"] },
  { match: /hyperextension|back extension/i, aliases: ["lombaires", "extension lombaire", "hyperextension"] },
  { match: /pullover/i, aliases: ["pull over", "pullover"] },
  { match: /farmer/i, aliases: ["marche du fermier", "farmer walk"] },
  { match: /smith/i, aliases: ["smith machine", "cadre guidé", "barre guidée"] },
  { match: /burpee/i, aliases: ["burpees"] },
  { match: /jumping jack/i, aliases: ["jumping jacks"] },
];

// Single words people type for the words the catalog uses (abbreviations,
// French equipment/position words). Each query word also matches any of
// its alternatives.
const WORD_SYNONYMS: Record<string, string[]> = {
  db: ["dumbbell"],
  dumbell: ["dumbbell"],
  haltere: ["dumbbell"],
  halteres: ["dumbbell"],
  bb: ["barbell"],
  barre: ["barbell", "bar"],
  kb: ["kettlebell"],
  poulie: ["cable"],
  poulies: ["cable"],
  cables: ["cable"],
  banc: ["bench"],
  incline: ["incline"],
  decline: ["decline"],
  assis: ["seated"],
  debout: ["standing"],
  allonge: ["lying"],
  couche: ["lying", "bench"],
  elastique: ["band"],
  bande: ["band"],
  unilateral: ["single"],
  pecs: ["chest", "pec"],
  pectoraux: ["chest"],
  epaules: ["shoulder"],
  epaule: ["shoulder"],
  dos: ["back"],
  jambes: ["leg"],
  jambe: ["leg"],
  fessiers: ["glute"],
  biceps: ["biceps", "curl"],
  triceps: ["triceps"],
  squats: ["squat"],
  curls: ["curl"],
  rows: ["row"],
  rowing: ["row"],
  tirage: ["pulldown", "row", "pull"],
  developpe: ["press"],
  presse: ["press"],
  ecarte: ["fly"],
  ecartes: ["fly"],
  flys: ["fly"],
  flyes: ["fly"],
  extensions: ["extension"],
  elevation: ["raise"],
  elevations: ["raise"],
  machines: ["machine", "lever"],
  machine: ["machine", "lever"],
};

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

// Returns the matching items, best match first. An empty query returns
// every item in its original order.
export function searchExercises<T extends { name: string }>(
  index: IndexedExercise<T>[],
  query: string,
): T[] {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return index.map((entry) => entry.item);

  const queryWords = normalizedQuery.split(" ");
  const queryCompact = compact(normalizedQuery);
  const memoizedScorers = queryWords.map((queryWord) => {
    const cache = new Map<string, number>();
    return (word: string) => {
      let score = cache.get(word);
      if (score === undefined) {
        score = queryWordScore(queryWord, word);
        cache.set(word, score);
      }
      return score;
    };
  });

  const scored: { item: T; score: number; name: string }[] = [];
  for (const entry of index) {
    let score: number;

    if (entry.name === normalizedQuery) {
      score = 1000;
    } else if (entry.name.startsWith(normalizedQuery)) {
      score = 900;
    } else if (entry.name.includes(normalizedQuery)) {
      score = 800;
    } else if (queryCompact.length >= 4 && entry.compactAll.includes(queryCompact)) {
      // "pullup" / "pecfly" / a whole alias typed as-is.
      score = 700;
    } else {
      // Every query word must match a word of the name or of an alias.
      let total = 0;
      let matchedAll = true;
      for (const scoreOf of memoizedScorers) {
        const inName = bestWordScore(entry.nameWords, scoreOf);
        const inAlias = bestWordScore(entry.aliasWords, scoreOf);
        // Matching the real name ranks above matching an alias.
        const wordScore = Math.max(inName * 10, inAlias * 8);
        if (wordScore === 0) {
          matchedAll = false;
          break;
        }
        total += wordScore;
      }
      if (!matchedAll) continue;
      score = (total / queryWords.length) * 20; // at most 600
    }

    scored.push({ item: entry.item, score, name: entry.name });
  }

  // Ties: shorter (more general) names first, then alphabetical.
  scored.sort(
    (a, b) =>
      b.score - a.score || a.name.length - b.name.length || a.name.localeCompare(b.name),
  );
  return scored.map((s) => s.item);
}
