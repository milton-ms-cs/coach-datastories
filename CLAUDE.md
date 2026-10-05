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

`buildContextMessage()` re-reads everything before every `ask()`. It walks `codioIDE.files.getStructure()` and orders files: student `.py` first (with `main.py` first of all), then notes, then data, then helpers. How each kind of file is sent:

| File kind | What's sent |
|---|---|
| Student `.py`, `.md`, `model-notes.txt` | In full, up to 15k chars. Empty ones are flagged "nothing written yet". |
| CSV/TSV/TXT/JSON | Whole if ≤3k chars. Otherwise a **preview** with the row count: header + 5 rows for CSVs, the first 15 lines otherwise. `goodreads.csv` is 9,979 rows. |
| Helper libraries | **Signatures + docstrings only** (`extractApi`). They're read from the student's own workspace, so the reference always matches that box's version. |
| Images, `.tm`, other binaries | Listed by name only |

Other rules:
- **Open editor buffers win over saved content.**
- **Total budget is 40k chars.**
- **Never sent:** dot-files and dot-dirs, which includes `.guides/` and therefore `.guides/secure` solutions; `README.md`, `CLAUDE.md`, `TEACHER_README.md` (which can hold answers) and `TEMPLATE_VERSION`; `__pycache__`. The harness plants a secret in each to prove it.

## Prompt notes

These sections are specific to this coach on top of the shared rules:
- **Diagnosing vs. solving.**
- **Interpreting data is theirs.**
- **Prompts are their work:** never write a student's system prompt or the Ethical Assistant's rules.
- **A strange model answer is usually not a bug:** "find its limit" and "where the model is wrong" are lessons.
- **Helper libraries are course tools.**
- **Common traps:** header row, `strip()`, empty cells, `plt.show()`, `chat()` history.
- **Codio section:** includes the Teachable Machine exception.
- **Teacher referral:** also covers LLM/image calls failing with key or connection errors.

The old ds_helpers/notebook prompt and the notebook code path are gone. If notebooks come back, restore them from v1.8.0 in git history.
