# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

**Data & AI Coach** — the Codio Custom Assistant for Grade 8 CS **Unit 1 (Python with Data)** and **Unit 2 (Data and Machine Learning)**. It's `index.js` (an IIFE) plus `metadata.json`, with no build step and no dependencies.

**Read the parent `../CLAUDE.md` first.** It covers the shared coach architecture, the `coachBot` API and its quirks, session logging, release flow, and the Codio/teacher-referral prompt sections.

The repo is still named `coach-datastories`. Until v1.8.0 this was the **Data Stories Coach**, which only worked with an open Jupyter notebook and taught the `ds_helpers` library. In 2026-27 the data unit has no notebooks, so v2.0.0 (Oct 2026) rebuilt it for plain Python projects. Three things were deliberately kept so existing Codio settings and logs still work:
- the button id `dataStoriesHelp`
- `COACH_ID = "datastories"` in `.coach-log.json`
- the repo name

Only the label (`Data & AI Coach`) changed.

## Public repo: no student data, ever

This repository is public, because Codio installs extensions from GitHub. Never commit anything that comes from a real student: names, emails, IDs, their code, questions, transcripts, `.coach-log.json` contents or rows from Codio exports. Paraphrased or "anonymized" snippets count too. Prompt examples and test fixtures must be made up from scratch. Git history is permanent, so check `git diff --cached` before every commit. Full rule: the parent `../CLAUDE.md`.

## Commands

```bash
node --check index.js        # syntax check
node test/run-test.js        # in-memory Codio boxes from both units
```

`index.js` exposes `window.__dataCoachTest` solely for the harness. `test/fixtures/` holds copies of the real `mlms.py`, `simple_llm.py`, `simple_image_llm.py` and a chatbot `main.py` from the course assignment repos. Refresh them if the course libraries change.

## What the boxes look like

Each box has a `main.py` that runs with ▶ Run (`python3 main.py`). Charts use `matplotlib.use("Agg")` and are saved as PNGs, then opened from the file tree. CSVs are read with `open()`/`strip()`/`split()`, with no pandas. Unit 2 adds three course libraries next to `main.py`:
- `mlms.py` (`TextClassifier`, `TextRecommender`; two versions exist across boxes)
- `simple_llm.py` (`ask_once`, `chat`)
- `simple_image_llm.py` (`generate_image`)

The Teachable Machine lessons have no code: a `.tm` file the student downloads to the Teachable Machine **website** (not Codio), plus `model-notes.txt`.

## Context building (`readWorkspace`)

`buildContextMessage()` re-reads everything before every `ask()`. It walks `codioIDE.files.getStructure()` and ranks files for the budget: student `.py` first (with `main.py` first of all), then notes, then data, then helpers. The rank only decides what fits; the files are DISPLAYED sorted by path so the fingerprint is stable. How each kind of file is sent:

| File kind | What's sent |
|---|---|
| Student `.py`, `.md`, `model-notes.txt` | In full, up to 15k chars. Empty ones show "(empty file)"; ones over the cap show "(cut off after 15000 characters)". |
| CSV/TSV/TXT/JSON | Whole if ≤3k chars. Otherwise a **preview** with the row count: header + 5 rows for CSVs, the first 15 lines otherwise. `goodreads.csv` is 9,979 rows. |
| Helper libraries | **Signatures + docstrings only** (`extractApi`). They're read from the student's own workspace, so the reference always matches that box's version. |
| Images, `.tm`, other binaries | Listed by name only |

Other rules:
- **Open editor buffers win over saved content.**
- **Total budget is 40k chars.**
- **Never sent:** dot-files and dot-dirs, which includes `.guides/` and therefore `.guides/secure` solutions; `README.md`, `CLAUDE.md`, `TEACHER_README.md` (which can hold answers) and `TEMPLATE_VERSION`; `__pycache__`. The harness plants a secret in each to prove it.

## Prompt notes

These sections are specific to this coach on top of the shared rules:
- **You always see their latest work:** the files are refreshed before every reply; when the files block changed, the turn's user message starts with a "files have changed" note. No apologizing for earlier advice that was right.
- **Short programs: one line can be the whole answer** (v2.1.0, replaces the old "small fix" and "Solving" rules). Includes the debugging-assignment ladder ("First, check the assignment"), the Unit 1 skill list students must write themselves (counting, adding up, biggest/smallest, matching lists by position, True/False flags, filtering, dictionaries of counts, and/or, int()/float()), the "keep asking gives less" ladder, "Guide questions are theirs" (predict, trace, reflect), and "read the data file before naming a column" (use header.index()).
- **Interpreting data is theirs.**
- **Prompts are their work:** never write a student's system prompt or the Ethical Assistant's rules.
- **A strange model answer is usually not a bug:** "find its limit" and "where the model is wrong" are lessons.
- **Helper libraries are course tools.**
- **Common traps:** header row, `strip()`, empty cells, `plt.show()`, `chat()` history, always-true `x == "a" or "b"`.
- **About this chat and about you:** identity, no renaming or personas, off-task handling, what the "bye" box means.
- **Codio section:** includes the Teachable Machine exception.
- **Teacher referral:** also covers LLM/image calls failing with key or connection errors.

The old ds_helpers/notebook prompt and the notebook code path are gone. If notebooks come back, restore them from v1.8.0 in git history.

## Turn loop behaviour (v2.1.0)

- **Exit:** `isExitMessage()`: exact `exitPhrases`, or a message of up to 6 words where EVERY word is goodbye vocabulary and at least one is a real goodbye (so "thanks still broken" stays open); curly apostrophes handled. Checked on the first message too (no ask, no log session). The follow-up box says "(Type 'bye' when you're done.)". Blank messages are ignored.
- **Empty or failed replies** never enter history; the student is told to ask again, `failedReplies` is logged, and if the first reply failed the next question rebuilds a fresh context for itself.
- **Context refresh** ends with "(The student's first question in this chat was: ...)" instead of re-presenting it as current.
- **Fingerprints:** `contextFingerprints` in the session log holds `{len, hash, changed}` per turn for the `<files>` block (FNV-1a). `changed` compares with `lastAnsweredHash`, which advances only after a non-empty reply and lives outside the capped array. A failed context refresh logs `{len: null, hash: null, changed: false, refreshFailed: true}`. File sections are sorted by path so key order can't flip the hash.
- **Files block:** empty files show "(empty file)"; files cut at the cap show "(cut off after N characters)"; files skipped by the budget or unreadable (failed, timed out, non-text) are named on a "Not shown (too long to include, or couldn't be read)" line. Every files-API read is bounded by `withTimeout` (8s). If the first context build fails the coach answers with a no-files fallback context.
- **Log safety:** `loadSessionHistory()` returns null on an unreadable log and saving is then disabled for the session, so the shared log can't be wiped. An empty `getStructure()` result is not trusted as "the log is missing".
- **Strict mode (v2.1.0):** a nudge toward trying first, turned on from the workspace's own `.coach-log.json` history (the log is per box: one student on one assignment, so nothing carries over from other assignments; see the top-level coaches CLAUDE.md, Session Logging) (20 logged questions from this coach's sessions in the last `STRICT_WORKSPACE_DAYS` = 14 days, 10 in this session, or 5 "next step" asks among the last 8) and off again after two real attempts in a row. Thresholds are the `STRICT_*` constants; the extra advice is `STRICT_PROMPT` (appended to the system prompt, never mentioned to the student). Session log entries gain `strict`, `strictReason` ("workspace", "session", "next-steps") and `strictReleased`. The block is shared verbatim across the coaches (not coach-vibe-coder).
- **Failed context refresh:** if `getContext()` fails on a follow-up turn, the previous context is kept (and a `refreshFailed` fingerprint entry is logged); on the first turn it falls back to no open-tab files.
