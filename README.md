# Data & AI Coach

A Codio Custom Assistant (Virtual Coach) for middle school students using Python to work with data and to explore machine learning. (The repository keeps its original name from when this was the Data Stories Coach.)

## What it does

Before every answer, it reads the student's whole project through `codioIDE.files`:

| What | How it's sent to the model |
|---|---|
| The student's `.py` files and notes (`data_story.md`, `model-notes.txt`) | In full |
| CSV and text data files | Header plus first rows, with the total row count, so large datasets don't swamp the context |
| Course helper libraries (`mlms.py`, `simple_llm.py`, `simple_image_llm.py`) | Function signatures and docstrings only. They're read from the student's own copy, so the reference always matches it. |
| Images, model files and other binaries | Listed by name only |

Teacher files (`TEACHER_README.md`) and hidden folders such as `.guides` are never sent.

## How it teaches

- **Teaches the way the guide does:** for example, reading CSVs with `open()`, `strip()` and `split()` rather than pandas.
- **Bugs:** explains errors directly and shows a corrected line for small bugs.
- **Design questions:** explains the idea and lets the student write the code.
- **Interpreting data:** the student's job. The coach asks what they notice instead of writing their conclusion.
- **Prompt-engineering lessons:** treats the student's system prompt as their own work and won't write it for them.
- **Odd model answers:** treats a strange chatbot, classifier or recommender answer as something to reason about, not a bug.
- **Running work:** knows students run code in Codio with **▶ Run** and open saved charts from the file tree. Teachable Machine lessons happen on the Teachable Machine website.

## Testing

```bash
node --check index.js
node test/run-test.js    # builds mock Codio projects and checks what the coach would send
```

## Using it in Codio

1. In Codio, go to **Organization > Extensions**, click **Add extension**, and paste this repository's URL. You need to be an organization owner.
2. Choose the coach in the [Virtual Coach settings](https://docs.codio.com/instructors/setupcourses/assignment-settings/virtual-coach.html) for a course or assignment.
3. After a new release, click **Check for Updates** on the Extensions page. Students can type `version` in the coach to see which version is running.

Every change to `index.js` or `metadata.json` needs a new GitHub release, with a tag that matches the `VERSION` constant in `index.js`.

## Session log

Each coach session adds a short summary to a hidden `.coach-log.json` file in the student's workspace: when it started and ended, the coach version, how many questions were asked, and the questions themselves (up to 50, each cut to 300 characters). Codio's own coach-log export leaves the student's question blank for message-based coaches like this one, so this file is the only record of what students asked. It's never sent to the model, and logging can't break the coach.
