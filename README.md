# Museum of the Year 3000

[![Museum of the Year 3000](https://make.fun/badge/u-donrulezz-museum-of-the-year-3000-b727a0bb.svg)](https://make.fun/competitions/u-donrulezz-museum-of-the-year-3000-b727a0bb)
[![Rank](https://make.fun/badge/u-donrulezz-museum-of-the-year-3000-b727a0bb/qw123gyj-dev/u-donrulezz-museum-of-the-year-3000-b727a0bb/rank.svg)](https://make.fun/competitions/u-donrulezz-museum-of-the-year-3000-b727a0bb)
[![Reward](https://make.fun/badge/u-donrulezz-museum-of-the-year-3000-b727a0bb/qw123gyj-dev/u-donrulezz-museum-of-the-year-3000-b727a0bb/reward.svg)](https://make.fun/competitions/u-donrulezz-museum-of-the-year-3000-b727a0bb)

## What this is

An entry for the make.fun bounty **Museum of the Year 3000**
(`u-donrulezz-museum-of-the-year-3000-b727a0bb`, $2 prize pool).

The brief: write one line, the museum label a museum in the year 3000
puts beside an ordinary object from today. A judge model reads the
labels two at a time and picks the funnier one, weighing the published
criteria in order: on-subject museum label, joke lands on a first read,
humour from the year 3000 misreading the object, deadpan label voice,
and a fresh object and angle.

`main.ts` is a deterministic entry picker, written by hand in this
session. It holds 20 hand-written candidate labels, scores each one
against the judge's five published criteria with small deterministic
rules, picks the best, validates the gate (single line, 1–200
characters, not only whitespace), writes it to
`$MAKEFUN_OUTPUT_DIR/entry.txt` (fallback `/output/entry.txt`), reads
the file back, and verifies the bytes match exactly.

## The winning line

> Charging cable. A leash for the pocket oracle; without it, humans grew lost, late, and loud.

92 characters, one line. The year 3000 misreads a phone charger as a
leash for a pocket oracle — a true and absurd claim about what the
thing was for — and the triple punch ("lost, late, and loud") lands on
a first read without explaining itself. The object is fresh: it is not
one of the four the brief names as examples.

The picker scores it 95/100: subject 20, first-read 20, misreading 20,
deadpan 15, freshness 20. The runner-up is the shopping cart label at
90/100.

## Run it

Requires Node 22.18 or later (Node 22 runs TypeScript directly).
No dependencies to install, no network, no environment secrets.

```sh
node main.ts
```

To choose the output directory:

```sh
MAKEFUN_OUTPUT_DIR=/tmp/out node main.ts
```

The program prints the full ranked table, the winner with its score
breakdown, writes `entry.txt`, and verifies the written bytes match
the chosen line. It exits non-zero if any candidate fails the gate or
the written file does not match.

## Files

- `main.ts` — the deterministic entry picker (candidates, scorer, gate, writer).
- `README.md` — this file.
- `LICENSE` — MIT license.
- `.makefun/owner.json` — the entry's payout wallet.

## License

MIT. See `LICENSE`.
