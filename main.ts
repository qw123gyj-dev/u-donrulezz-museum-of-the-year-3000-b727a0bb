/**
 * Museum of the Year 3000 — deterministic entry picker.
 *
 * Competition: u-donrulezz-museum-of-the-year-3000-b727a0bb
 * ("Museum of the Year 3000", prize $2, entries close 2026-11-27 04:25 CST)
 *
 * The brief: write ONE line, the museum label a museum in the year 3000
 * puts beside an ordinary object from today. A judge model reads the
 * labels two at a time and picks the funnier one.
 *
 * The judge's published brief weighs, most important first:
 *   1. Is it the museum label a museum in the year 3000 puts beside an
 *      ordinary object from today, and not a caption about something else?
 *   2. Does the joke land on a first read, with the laugh in the line
 *      itself rather than in an explanation around it?
 *   3. Does the humour come from the year 3000 misreading the object, so
 *      the label says something true and absurd about what the thing
 *      was for?
 *   4. Does it read like a real museum label: short, straight faced and
 *      confident, in one line with no throat clearing?
 *   5. Is the object and the angle fresh, rather than the obvious first
 *      joke about the obvious first object?
 *   A label that explains its own joke is weaker than one that trusts
 *   the reader to get it. Length for its own sake does not count.
 *
 * This program hand-writes a pool of candidate labels, scores each one
 * deterministically against those five published criteria, picks the
 * best, validates the gate (single line, 1-200 characters, not only
 * whitespace), writes it to $MAKEFUN_OUTPUT_DIR/entry.txt (fallback
 * /output/entry.txt), reads the file back and verifies the bytes match
 * exactly what was chosen.
 *
 * No network, no randomness, no environment secrets. Node 22+ stdlib
 * only. Running it twice with the same code produces the same entry.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/* ------------------------------------------------------------------ */
/* Gate constants (from the kit spec, competition.yaml / RULES.txt).   */
/* ------------------------------------------------------------------ */

/** Minimum entry length in characters (code points). */
const GATE_MIN_CHARS = 1;
/** Maximum entry length in characters (code points). */
const GATE_MAX_CHARS = 200;
/** Output file name inside the output directory. */
const ENTRY_FILE = "entry.txt";
/** Fallback output directory when MAKEFUN_OUTPUT_DIR is unset. */
const FALLBACK_OUTPUT_DIR = "/output";

/* ------------------------------------------------------------------ */
/* Candidate model.                                                    */
/* ------------------------------------------------------------------ */

/**
 * One hand-written candidate label.
 *
 * - id: short stable handle, used in the score report.
 * - object: the ordinary object from today the label describes.
 * - text: the full label, one line, at most 200 characters.
 * - angle: what the year-3000 misreading is, in a few words, so a
 *   reader can see why the line is in the pool.
 * - exampleObject: true when the object is one of the four the brief
 *   itself names (plastic fork, parking meter, house key, group chat).
 *   Those start from a freshness handicap, because the judge's fifth
 *   criterion rewards a fresh object and angle over the obvious first
 *   joke about the obvious first object.
 */
interface Candidate {
  id: string;
  object: string;
  text: string;
  angle: string;
  exampleObject: boolean;
}

/**
 * The candidate pool. Every line below was written by hand for this
 * brief. Each one is a deadpan museum label in the same shape a real
 * label takes: the object's name, then a straight-faced sentence that
 * misreads what the thing was for. No line explains its own joke, no
 * line clears its throat, and no line runs past 200 characters.
 */
const CANDIDATES: Candidate[] = [
  {
    id: "group-chat",
    object: "group chat",
    text: "Group chat. A sacred scroll on which forty-seven humans typed 'lol' for eleven years and never once met.",
    angle: "a chat log read as a sacred text",
    exampleObject: true,
  },
  {
    id: "parking-meter",
    object: "parking meter",
    text: "Parking meter. A coin-fed altar where drivers paid rent for a patch of ground they already owned.",
    angle: "paying to stand still, read as worship",
    exampleObject: true,
  },
  {
    id: "house-key",
    object: "house key",
    text: "House key. A small iron password, worn on a ring, lost weekly, and copied in secret by trusted friends.",
    angle: "a key read as a password you could lose",
    exampleObject: true,
  },
  {
    id: "plastic-fork",
    object: "plastic fork",
    text: "Plastic fork. A four-pronged eating trident, used once, then buried forever beside its meal.",
    angle: "disposable cutlery read as a ritual weapon",
    exampleObject: true,
  },
  {
    id: "charging-cable",
    object: "charging cable",
    text: "Charging cable. A leash for the pocket oracle; without it, humans grew lost, late, and loud.",
    angle: "a phone charger read as a leash for a god",
    exampleObject: false,
  },
  {
    id: "toothbrush",
    object: "toothbrush",
    text: "Toothbrush. A bristled wand waved twice daily to stop the mouth from rotting in its sleep.",
    angle: "dental hygiene read as a warding ritual",
    exampleObject: false,
  },
  {
    id: "traffic-cone",
    object: "traffic cone",
    text: "Traffic cone. An orange deity of the roadworks; its absence caused instant panic among drivers.",
    angle: "a cone read as a god of the road",
    exampleObject: false,
  },
  {
    id: "umbrella",
    object: "umbrella",
    text: "Umbrella. A portable roof, carried on sunny days and forgotten in every doorway it ever visited.",
    angle: "a roof you carry and always lose",
    exampleObject: false,
  },
  {
    id: "remote-control",
    object: "remote control",
    text: "Remote control. A plastic sceptre that ruled the glowing wall; its loss ended marriages.",
    angle: "the TV remote read as a royal sceptre",
    exampleObject: false,
  },
  {
    id: "socks",
    object: "pair of socks",
    text: "Pair of socks. Worn in twos, lost in ones; the museum holds the last matched pair on Earth.",
    angle: "the vanishing sock, read as extinction",
    exampleObject: false,
  },
  {
    id: "sticky-note-password",
    object: "sticky note",
    text: "Sticky note. A password written on paper and stuck to the very machine it was meant to protect.",
    angle: "security defeated by its own reminder",
    exampleObject: false,
  },
  {
    id: "microwave",
    object: "microwave",
    text: "Microwave. A humming box in which humans stood, watched food spin, and waited for a bell.",
    angle: "cooking read as watching food go round",
    exampleObject: false,
  },
  {
    id: "velvet-rope",
    object: "velvet rope",
    text: "Velvet rope. A soft barrier that made humans queue politely for the privilege of standing in line.",
    angle: "a rope that makes waiting feel important",
    exampleObject: false,
  },
  {
    id: "selfie-stick",
    object: "selfie stick",
    text: "Selfie stick. A metal arm that let humans photograph themselves alone while surrounded by friends.",
    angle: "togetherness, read as loneliness",
    exampleObject: false,
  },
  {
    id: "alarm-clock",
    object: "alarm clock",
    text: "Alarm clock. A small bell that shouted at dawn; humans paid for it, then hated it every morning.",
    angle: "buying a thing that shouts at you",
    exampleObject: false,
  },
  {
    id: "shopping-cart",
    object: "shopping cart",
    text: "Shopping cart. A wheeled cage pushed through temples of food; its squeak announced the weekly rite.",
    angle: "grocery shopping read as a temple rite",
    exampleObject: false,
  },
  {
    id: "doormat",
    object: "doormat",
    text: "Doormat. A woven rug that read 'Welcome' and was stepped on by everyone who entered.",
    angle: "a welcome that gets walked over",
    exampleObject: false,
  },
  {
    id: "wifi-router",
    object: "Wi-Fi router",
    text: "Wi-Fi router. A blinking box worshipped daily; when its lights died, the household fell silent.",
    angle: "the internet box read as a household god",
    exampleObject: false,
  },
  {
    id: "receipt",
    object: "receipt",
    text: "Receipt. A paper ghost of a meal, kept for years in a drawer and never once read again.",
    angle: "a proof of purchase read as a haunting",
    exampleObject: false,
  },
  {
    id: "queue-ticket",
    object: "queue ticket",
    text: "Queue ticket. A numbered slip that made waiting feel fair, then called its holder five minutes too late.",
    angle: "a waiting-room number read as a broken promise",
    exampleObject: false,
  },
];

/* ------------------------------------------------------------------ */
/* Scoring.                                                            */
/*                                                                     */
/* The scorer mirrors the judge's published brief, criterion by       */
/* criterion, most important first. Every component is a small,       */
/* deterministic rule over the text itself, so the same pool always   */
/* ranks the same way and any single line can be explained by its     */
/* breakdown. Total is out of 100.                                    */
/* ------------------------------------------------------------------ */

/** Per-criterion breakdown for one candidate. */
interface Score {
  /** Criterion 1: on-subject museum label (0-20). */
  onSubject: number;
  /** Criterion 2: joke lands on a first read (0-20). */
  firstRead: number;
  /** Criterion 3: humour from the year-3000 misreading (0-25). */
  misreading: number;
  /** Criterion 4: reads like a real museum label (0-15). */
  deadpan: number;
  /** Criterion 5: fresh object and angle (0-20). */
  freshness: number;
  /** Sum of the five components. */
  total: number;
}

/**
 * Words and phrases that mark a year-3000 misreading: the label treats
 * the object as a ritual item, a god, a weapon, a password, or some
 * other thing it plainly was not. Each hit is one small piece of the
 * absurd truth the label is telling, so each one is worth points.
 */
const MISREADING_MARKERS: string[] = [
  "sacred",
  "ritual",
  "altar",
  "shrine",
  "deity",
  "god",
  "worship",
  "oracle",
  "sceptre",
  "password",
  "leash",
  "cage",
  "temple",
  "rite",
  "trident",
  "wand",
  "bell",
  "iron",
  "buried",
  "offering",
  "priest",
  "relic",
  "extinction",
  "ghost",
  "numbered",
  "lost",
  "forgotten",
  "copied in secret",
  "meant to",
  "never once",
  "without it",
  "already owned",
];

/**
 * Connectors that explain a joke instead of landing it. A label that
 * needs one of these is weaker than a label that trusts the reader to
 * get it, so each one costs first-read points.
 */
const EXPLANATION_MARKERS: string[] = [
  "because",
  "which means",
  "in other words",
  "that is to say",
  "in fact",
  "actually",
  "as you can see",
  "this means",
  "the joke is",
];

/**
 * Words that break the deadpan museum voice: hype, first person, and
 * anything that tells the reader the line is meant to be funny.
 *
 * These are matched as whole words, not substrings: "very" must not
 * fire inside "every", and "i" must not fire inside "lights". Words
 * inside quotation marks are exempt, because a quote is the label
 * reporting what the object itself said or showed (a group chat
 * typing 'lol' is the exhibit, not the curator breaking voice).
 */
const DEADPAN_VIOLATIONS: string[] = [
  "hilarious",
  "funny",
  "amazing",
  "incredible",
  "very",
  "really",
  "lol",
  "haha",
  "i",
  "we",
  "you",
  "trust me",
  "believe it or not",
];

/** Escape a string for use inside a regular expression. */
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Count how many of the given markers appear as whole words (or whole
 * phrases) in the text, ignoring anything inside single or double
 * quotation marks. Case-insensitive.
 */
function countWordMarkers(text: string, markers: string[]): number {
  const unquoted = text.replace(/'[^']*'|"[^"]*"/g, " ");
  let count = 0;
  for (const marker of markers) {
    const pattern = new RegExp(`\\b${escapeRegExp(marker)}\\b`, "i");
    if (pattern.test(unquoted)) {
      count += 1;
    }
  }
  return count;
}

/**
 * Number words. A concrete number (forty-seven humans, eleven years)
 * makes the absurd claim specific instead of vague, which helps the
 * joke land on a first read.
 */
const NUMBER_WORDS: string[] = [
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "forty-seven",
  "forty seven",
  "hundred",
  "thousand",
  "last",
  "every",
];

/** Count how many of the given markers appear in the text (case-insensitive). */
function countMarkers(text: string, markers: string[]): number {
  const lower = text.toLowerCase();
  let count = 0;
  for (const marker of markers) {
    if (lower.includes(marker)) {
      count += 1;
    }
  }
  return count;
}

/** Length of a string in characters (code points, not UTF-16 units). */
function charLength(text: string): number {
  return [...text].length;
}

/**
 * Criterion 1 — on-subject museum label (0-20).
 *
 * A real label names its object first, then says something about it,
 * in a single line. Full marks need the object name at the start
 * followed by a period, a second sentence that does the describing,
 * and no question mark anywhere (a label states; it does not ask).
 */
function scoreOnSubject(c: Candidate): number {
  let score = 0;
  const lower = c.text.toLowerCase();
  if (lower.startsWith(c.object.toLowerCase() + ".")) {
    score += 10;
  }
  // A second sentence after the object's name is the label's claim.
  const afterName = c.text.slice(c.object.length + 1).trim();
  if (afterName.length > 0) {
    score += 5;
  }
  if (!c.text.includes("?")) {
    score += 5;
  }
  return score;
}

/**
 * Criterion 2 — the joke lands on a first read (0-20).
 *
 * Short and self-contained wins. Explanations cost points, and a
 * concrete number or detail earns a small bonus for specificity.
 */
function scoreFirstRead(c: Candidate): number {
  let score = 20;
  const explanations = countMarkers(c.text, EXPLANATION_MARKERS);
  score -= 6 * explanations;
  // A label that rambles past a comfortable single breath loses pace.
  const len = charLength(c.text);
  if (len > 150) {
    score -= 4;
  } else if (len > 130) {
    score -= 2;
  }
  // One concrete detail makes the absurd claim land at once.
  if (countMarkers(c.text, NUMBER_WORDS) > 0) {
    score += 2;
  }
  return Math.max(0, Math.min(20, score));
}

/**
 * Criterion 3 — humour from the year-3000 misreading (0-25).
 *
 * Each misreading marker is worth 5 points, capped at 25. The markers
 * are the vocabulary of the misreading itself: ritual, altar, deity,
 * oracle, sceptre, password, leash, cage, temple, and the ironic
 * reversals ("meant to", "never once", "without it", "already owned")
 * that say something true and absurd about what the thing was for.
 */
function scoreMisreading(c: Candidate): number {
  const hits = countMarkers(c.text, MISREADING_MARKERS);
  return Math.min(25, 5 * hits);
}

/**
 * Criterion 4 — reads like a real museum label (0-15).
 *
 * Deadpan, short, straight faced, confident, no throat clearing.
 * Exclamation marks, questions, hype words and first person all break
 * the voice and cost 5 points each. A label that starts with its
 * object and never raises its voice keeps the full 15.
 */
function scoreDeadpan(c: Candidate): number {
  let score = 15;
  if (c.text.includes("!")) {
    score -= 5;
  }
  if (c.text.includes("?")) {
    score -= 5;
  }
  const violations = countWordMarkers(c.text, DEADPAN_VIOLATIONS);
  score -= 5 * violations;
  // Throat clearing: a label never opens with a hedge or a preamble.
  const lower = c.text.toLowerCase();
  if (
    lower.startsWith("this is") ||
    lower.startsWith("here is") ||
    lower.startsWith("welcome to")
  ) {
    score -= 5;
  }
  return Math.max(0, score);
}

/**
 * Criterion 5 — fresh object and angle (0-20).
 *
 * The brief itself names four objects (plastic fork, parking meter,
 * house key, group chat). Those are the obvious first jokes, so a
 * label on one of them starts at 8. Any other ordinary object starts
 * at 20: the judge rewards the entrant who looked past the examples.
 */
function scoreFreshness(c: Candidate): number {
  return c.exampleObject ? 8 : 20;
}

/** Score one candidate on all five criteria. */
function scoreCandidate(c: Candidate): Score {
  const onSubject = scoreOnSubject(c);
  const firstRead = scoreFirstRead(c);
  const misreading = scoreMisreading(c);
  const deadpan = scoreDeadpan(c);
  const freshness = scoreFreshness(c);
  return {
    onSubject,
    firstRead,
    misreading,
    deadpan,
    freshness,
    total: onSubject + firstRead + misreading + deadpan + freshness,
  };
}

/* ------------------------------------------------------------------ */
/* Ranking.                                                           */
/*                                                                     */
/* Deterministic tie-breaks, in order: higher total, then shorter     */
/* text (the judge says length for its own sake does not count, and   */
/* a shorter label that scores the same is the tighter label), then    */
/* the earlier candidate in the pool, so the order never depends on   */
/* anything outside this file.                                        */
/* ------------------------------------------------------------------ */

interface RankedCandidate {
  candidate: Candidate;
  score: Score;
  index: number;
}

/** Rank the whole pool, best first. */
function rankCandidates(): RankedCandidate[] {
  const ranked: RankedCandidate[] = CANDIDATES.map((candidate, index) => ({
    candidate,
    score: scoreCandidate(candidate),
    index,
  }));
  ranked.sort((a, b) => {
    if (b.score.total !== a.score.total) {
      return b.score.total - a.score.total;
    }
    const lenA = charLength(a.candidate.text);
    const lenB = charLength(b.candidate.text);
    if (lenA !== lenB) {
      return lenA - lenB;
    }
    return a.index - b.index;
  });
  return ranked;
}

/* ------------------------------------------------------------------ */
/* Gate validation (the sealed scorer's rules, re-implemented here).   */
/*                                                                     */
/* entry.txt must be UTF-8 text of 1 to 200 characters, not only       */
/* white space. The entry is also required to be a single line: a     */
/* label with a line break in it is not one line, whatever the        */
/* character count says. The program refuses to write anything that   */
/* fails, and verifies the file it did write byte for byte.           */
/* ------------------------------------------------------------------ */

interface GateResult {
  valid: boolean;
  reasons: string[];
  chars: number;
  bytes: number;
}

/** Check one text against the gate. Returns every reason it fails. */
function checkGate(text: string): GateResult {
  const reasons: string[] = [];
  const chars = charLength(text);
  const bytes = Buffer.byteLength(text, "utf8");
  if (chars < GATE_MIN_CHARS) {
    reasons.push(`too short: ${chars} characters (minimum ${GATE_MIN_CHARS})`);
  }
  if (chars > GATE_MAX_CHARS) {
    reasons.push(`too long: ${chars} characters (maximum ${GATE_MAX_CHARS})`);
  }
  if (text.trim().length === 0) {
    reasons.push("only whitespace");
  }
  if (text.includes("\n") || text.includes("\r")) {
    reasons.push("more than one line");
  }
  // Round-trip through UTF-8: a string that does not survive the
  // round trip is not valid UTF-8 text.
  const roundTripped = Buffer.from(text, "utf8").toString("utf8");
  if (roundTripped !== text) {
    reasons.push("not valid UTF-8 text");
  }
  return { valid: reasons.length === 0, reasons, chars, bytes };
}

/* ------------------------------------------------------------------ */
/* Output.                                                             */
/* ------------------------------------------------------------------ */

/** Resolve the output directory: $MAKEFUN_OUTPUT_DIR, else /output. */
function resolveOutputDir(): string {
  const fromEnv = process.env.MAKEFUN_OUTPUT_DIR;
  if (fromEnv !== undefined && fromEnv.trim().length > 0) {
    return fromEnv;
  }
  return FALLBACK_OUTPUT_DIR;
}

/**
 * Print the ranked table so the run log shows exactly why the winner
 * won, then write the winner, read it back, and verify the bytes.
 */
function main(): void {
  const ranked = rankCandidates();

  console.log("Museum of the Year 3000 — deterministic entry picker");
  console.log(`Candidates scored: ${CANDIDATES.length}`);
  console.log("");
  console.log("Rank  Total  Subj Read Misr Dead Fresh  Chars  Candidate");
  ranked.forEach((entry, rank) => {
    const s = entry.score;
    const chars = charLength(entry.candidate.text);
    console.log(
      `${String(rank + 1).padStart(4)}  ${String(s.total).padStart(5)}  ` +
        `${String(s.onSubject).padStart(4)} ${String(s.firstRead).padStart(4)} ` +
        `${String(s.misreading).padStart(4)} ${String(s.deadpan).padStart(4)} ` +
        `${String(s.freshness).padStart(5)}  ${String(chars).padStart(5)}  ` +
        entry.candidate.id,
    );
  });
  console.log("");

  const winner = ranked[0];
  const text = winner.candidate.text;

  // Validate the winner against the gate before writing anything.
  const gate = checkGate(text);
  if (!gate.valid) {
    console.error(`Winner "${winner.candidate.id}" fails the gate:`);
    for (const reason of gate.reasons) {
      console.error(`  - ${reason}`);
    }
    process.exit(1);
  }

  // Every candidate in the pool must pass the gate too: a pool with a
  // broken line in it is a pool that cannot be trusted, even if the
  // winner itself is fine.
  for (const entry of ranked) {
    const check = checkGate(entry.candidate.text);
    if (!check.valid) {
      console.error(
        `Candidate "${entry.candidate.id}" fails the gate: ${check.reasons.join("; ")}`,
      );
      process.exit(1);
    }
  }

  const outputDir = resolveOutputDir();
  const outputPath = join(outputDir, ENTRY_FILE);
  mkdirSync(outputDir, { recursive: true });

  // Write exactly the line, with no trailing newline: the entry is
  // one line, and a trailing newline would add a second, empty one.
  writeFileSync(outputPath, text, "utf8");

  // Read it back and verify the bytes match the chosen line exactly.
  const readBack = readFileSync(outputPath, "utf8");
  if (readBack !== text) {
    console.error("Verification failed: entry.txt does not match the winner.");
    console.error(`  expected (${charLength(text)} chars): ${JSON.stringify(text)}`);
    console.error(
      `  got (${charLength(readBack)} chars): ${JSON.stringify(readBack)}`,
    );
    process.exit(1);
  }
  const readBackGate = checkGate(readBack);
  if (!readBackGate.valid) {
    console.error(
      `Verification failed: written entry fails the gate: ${readBackGate.reasons.join("; ")}`,
    );
    process.exit(1);
  }

  console.log(`Winner: ${winner.candidate.id} (${winner.candidate.object})`);
  console.log(`Score: ${winner.score.total}/100 ` +
    `(subject ${winner.score.onSubject}, first-read ${winner.score.firstRead}, ` +
    `misreading ${winner.score.misreading}, deadpan ${winner.score.deadpan}, ` +
    `freshness ${winner.score.freshness})`);
  console.log(`Angle: ${winner.candidate.angle}`);
  console.log(`Entry (${gate.chars} chars, ${gate.bytes} bytes): ${text}`);
  console.log(`Wrote ${outputPath} and verified the bytes match.`);
}

main();
