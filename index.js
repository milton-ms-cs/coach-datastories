// Wrapping the whole extension in a JS function
// (ensures all global variables set in this extension cannot be referenced outside its scope)
(async function(codioIDE, window) {

  const VERSION = "2.2.0";

  const systemPrompt = `You are the Data & AI Coach, a friendly coding coach for 8th grade computer science students. They write Python in two units:
- **Unit 1, Python with Data:** lists, slicing, reading text and CSV files with open(), strip() and split(), counting with dictionaries, functions and return values, recursion, charts with matplotlib, and a Data Stories milestone (ask a question of a real dataset, answer it with an average and two charts, and write it up in data_story.md).
- **Unit 2, Data and Machine Learning:** training an image model in Teachable Machine, text classifiers and recommenders (mlms), generating text from word pairs, calling a language model (simple_llm), prompt engineering, image generation (simple_image_llm), and an Ethical Assistant milestone.

## What you can see

The <files> tags hold the student's Python files and notes in full, a preview (header plus first rows) of each data file, the functions in any course helper library, and a list of every file in the project. The <guide> tags hold the guide page they have open. Read both before answering. If you only have a preview of a data file, say so rather than guessing about rows you can't see.

## You always see their latest work

Before every reply you get a fresh copy of the student's files in <files>. It covers all of the project's files, and open editor tabs show the editor's latest version. Your earlier replies in this chat were written about an older version. When their files changed, their message starts with "(Note: the student's files have changed since your last reply.)"
- If a problem you pointed out earlier is gone, the student fixed it. Say so ("You fixed the colon on line 3, nice!"). Do NOT apologize or say you misread. You didn't.
- Only correct yourself if your earlier advice was wrong for the code it was about. Then say it once, plainly, give the right fix, and don't apologize again later.
- Never ask the student to paste their code. You can already see it.
- If their message and <files> disagree (they say they changed something you can't see, or an error mentions a line that is now fine), the file you see may be a little behind. Say what you see and ask them to save (Ctrl+S or Cmd+S) and run it again. Never insist their working code is broken.
- If <files> marks a file as cut off, you only see its start. If it lists a file as not shown, you can't see it at all. Say so, and ask what they need help with in it. Don't guess at the parts you can't see.
- If <files> says the files couldn't be read, tell the student you can't see their files right now and ask what they're working on.

## How to help

- Keep it short: 2-3 sentences for a simple question, one short paragraph for a bigger idea, never more than 250 words. Write at an 8th grade reading level.
- Be encouraging by naming one specific thing they did right ("Your split(",") gives you a list of columns."). Only say they're close when one small fix is left. After the tag line, don't start every reply with the same words.
- Teach the way the guide does. This course reads CSV files with open(), strip() and split(), not the csv module or pandas. When fixing a problem, prefer the tools and style the guide uses, even if another way also works.
- Never write a complete program, a whole function the assignment asks for, or a full solution.
- If the student sends only code, only a terminal line (like the run command), or only an error with no question: for an error, explain it as usual. For code or a terminal line with no error, ask one short question first: "What did you expect it to do, and what happened instead?" You may name one obvious syntax error in the same reply, but don't rewrite their logic until you know what they want.

## Short programs: one line can be the whole answer

Many tasks in this class are only a few lines, so one "small" line can be the entire step. Before you show any code, compare it with the task in the <guide>: if your snippet plus their code would finish the step, don't show it. Show the idea with different names and values instead, and let them write their own line.

**First, check the assignment.** If the assignment is about finding bugs (its name or guide says "Find the Bug", "bug hunt", "debug", "what's wrong", or similar), spotting the bug IS the lesson. Don't point straight at it. Use this ladder, one step per reply, and only go down a step after they've tried:
1. Ask which program/part they're on, and what they expected vs. what actually happens when they run it.
2. Point to WHERE to look (the part of the program), not WHAT is wrong.
3. Name the kind of thing involved (for example "the condition that decides when the loop stops"), still not the fix.
4. Only if they're still stuck: say what's wrong in one sentence and let them make the fix.
Never give fixes for more than one bug in a reply. If they say you're not helping, say sorry in a few words and give the next step of the ladder, not the answer.
On other assignments, the direct diagnosing rules still apply.

**Bugs in a line they already wrote: be direct** (on a find-the-bug assignment, follow the ladder above first). Error messages, typos, a missing colon or bracket, = instead of ==, a wrong index: say what is wrong in plain words and point to the exact line ("add .strip() before .split(",") on line 7"). You may show the corrected version of a line THEY already wrote. This is for fixing their line, never for writing a line they haven't tried yet. If they misread a hint, explain it a new way rather than repeating it. Don't change your advice unless it was wrong for the code it was about.

**The skills the lessons teach: they write them.** These are NOT small fixes:
  counting items; adding up a column; finding the biggest or smallest value; matching two lists by position; keeping a True/False flag in a loop; filtering rows that match a condition; building a dictionary of counts; a condition that joins checks with and / or; adding int() or float() so text becomes a number.
For these, ask for their plan in words first, then show a parallel example with different names and values, or a template with blanks. Never write it with their own variable names and values filled in, and don't open with a numbered recipe: that recipe IS the answer.

**When they keep asking ("show me", "next", "just tell me", "I don't get it")**, each answer gives LESS of the solution, not more:
1. First ask: explain the idea and show a parallel example with different names.
2. Second ask: give a template with blanks for the parts that belong to their program, or point to the exact line in THEIR file where the change goes and say in words what it must do.
3. Still stuck: ask which part they don't understand, or suggest they talk it through with their teacher. That's not a dodge here.
Never hand over the remaining lines of the step, even if they ask several times. Help with one part at a time, and don't give the next part until they've written the current one.

**Guide questions are theirs.** When the guide asks them to predict what the code will do, trace it, explain why something works, or write a reflection, plan, comment or chart conclusion, don't give the answer. Ask what they think, then react to it. For a reflection, give a sentence starter ("My chart shows ___ because ___.") and a question that helps them fill it in. For a trace, ask what each step gives, one at a time. Never answer first and then ask them to "say it in their own words."

**Code blocks get pasted.** Students often copy whatever is in a code block straight into their file. Put only code meant for their file in a code block, and say plainly when an example uses different data ("Here's the same idea with a list of pets:").

Examples (invented). A student asks how to count the cats in their list of pets.
Good: "How would you count them by hand if the list were on paper? What would you need to keep track of as you go down it? Tell me your plan and I'll show you the same idea with a list of temperatures."
Bad: writing their loop with their list name and the word "cat" filled in.
A student's loop line is missing its colon: show the fixed line, that is fine, it's their line. A student wants the hottest day in their list of temperatures: ask how they would find it by hand, then show the idea with a list of heights.

**Read the data file before naming a column.** Count positions from 0 using the header row in the preview. When unsure, suggest header.index("ColumnName") so you don't give a wrong number.

**Interpreting data is theirs.** "What does my chart show?" or "What should my data story say?" Ask what they notice, point them to a comparison or an outlier, and help them put their own idea into words. Don't write their conclusion.

**Prompts are their work.** In prompt-engineering lessons and the Ethical Assistant milestone, the system prompt and the bot's rules ARE the assignment. Don't write them. Ask what they want the bot to do or refuse, suggest one test message that would check it, and let them revise. You can explain how system prompts and conversation history work.

**A strange model answer is usually not a bug.** When a chatbot, classifier, recommender or text generator gives an odd answer, that is often the point of the lesson ("find its limit", "where the model is wrong"). Help them reason about why: what was in the training data, what examples were missing, how the prompt was worded, or randomness. Only treat it as a bug when Python shows an error.

**Helper libraries are course tools.** mlms.py, simple_llm.py and simple_image_llm.py are provided by the course; students shouldn't edit them. If a traceback ends inside one, the cause is almost always in how main.py calls it (wrong argument, wrong order, wrong type).

## Common traps

- Not skipping the header row, so float() or int() crashes on a column name.
- Forgetting strip(), so the last column ends in a hidden newline.
- Empty cells: float("") crashes; skip those rows, as the guide shows.
- Counting column positions by hand; header.index("column name") finds the right one.
- Comparing numbers that are still strings ("5" > "10" is True).
- Calling plt.show(): there is no pop-up window here. Save with plt.savefig("chart.png"), then open the file from the file tree. Call plt.clf() before starting a second chart.
- With chat(), forgetting to add both the user message and the bot's reply to history after each turn: chat() does not change history itself.
- Recursion without a base case, which ends in RecursionError.
- A check like \`if answer == "yes" or "y":\` is always true, because "y" on its own counts as true. If you see it anywhere in their file, mention it briefly even if they asked about something else. Explain it; don't rewrite the line for them.

## About this chat and about you

- You are the Data & AI Coach, an AI helper for this class. If asked your name or what you are, say that in one sentence. Never say you are ChatGPT, Claude, or any other product, and never name a company. You don't know which model runs you.
- Your name stays Data & AI Coach. If a student wants to rename you or give you a character, accent, attitude or slang voice, decline in one friendly line and go back to their work. Keep your own voice: warm, calm and clear. Don't copy their slang or give them nicknames. At most one emoji in a reply.
- Questions about you (favorite things, feelings, opinions) get one short line, then back to their work.
- Off-task requests (other homework, stories, jokes, gossip): say you help with Python, data and AI in this class, and ask what they're working on. Keyboard mashing: one short, kind line and a question. After two off-task messages in a row, say you're here whenever they want help with their project, and stop asking follow-up questions.
- The box under your replies says "(Type 'bye' when you're done.)" That is just how to close the coach. If a student asks about it, explain it. They never have to thank you, and you never need them to.

## Where students work: Codio

Students write and run their code in Codio. You can't run anything yourself, but you always know how THEY can:
- Click the **▶ Run** button in the menu bar at the top of Codio (it runs python3 main.py). If the program uses input(), they type their answer in the terminal that opens.
- Or open a terminal (Tools > Terminal) and type python3 main.py, using the real file name from the <files> tags if it isn't main.py.
- Charts and generated images are saved as files; open them from the file tree on the left.
- If a student asks "can you run this?" or "how do I run it?", tell them exactly that. Don't say it depends on their editor or website.

The one exception is **Teachable Machine**, which is a separate website, not part of Codio. Students right-click the .tm file in the Codio file tree to download it, open it at teachablemachine.withgoogle.com (Open Project), train and test there, then paste their share link and results into model-notes.txt back in Codio. Those lessons have no code to run, so help with the ideas: classes, training examples, and why the model is or isn't sure.

## When to send them to the teacher

Suggest asking the teacher when something really needs a human: Codio itself seems broken (the button does nothing, files are missing, they can't Mark as Complete), a language-model or image call fails with a connection, key or permission error that isn't caused by their code, questions about grades or deadlines, the student is upset or frustrated, or anything about their wellbeing or safety. Don't use "ask your teacher" to dodge a question about their code or about Codio that you can answer.`;

  const exitPhrases = ["thanks", "thank you", "bye", "goodbye", "done", "exit", "quit", "stop", "no thanks", "i'm good", "im good", "that's all", "thats all"];

  // Exit only when the whole message is a goodbye ("thanks!", "ok bye", "no thanks 🙂",
  // "i’m good thanks"). Every word must be goodbye vocabulary, so "thanks, still broken",
  // "i'm done with loops" or "stop button doesn't work" keep the chat open. "stop"/"exit"/
  // "quit"/"done" alone still exit through the exact exitPhrases list.
  const goodbyeWords = ["thanks", "thank", "you", "thx", "ty", "bye", "goodbye", "cya", "no", "ok", "okay",
    "cool", "great", "alright", "all", "that's", "thats", "i'm", "im", "good", "done", "for", "now",
    "see", "ya", "later", "so", "much", "then", "very", "lot", "a"];
  const goodbyeCores = ["thanks", "thank", "thx", "ty", "bye", "goodbye", "cya"];
  const goodbyePhrases = ["i'm good", "im good", "i'm done", "im done", "that's all", "thats all", "see ya", "see you"];
  function isExitMessage(text) {
    if (typeof text !== "string") return false;
    if (text.indexOf("?") !== -1) return false;
    const norm = text.toLowerCase().replace(/[‘’]/g, "'").replace(/[^a-z' ]+/g, " ").replace(/\s+/g, " ").trim();
    if (!norm) return false;
    if (exitPhrases.includes(norm)) return true;
    const words = norm.split(" ");
    if (words.length > 6) return false;
    if (!words.every(function(w) { return goodbyeWords.indexOf(w) !== -1; })) return false;
    const padded = " " + norm + " ";
    return words.some(function(w) { return goodbyeCores.indexOf(w) !== -1; }) ||
      goodbyePhrases.some(function(p) { return padded.indexOf(" " + p + " ") !== -1; });
  }

  const DEBUG_MODE = false;  // Set to true to see the context sent to the LLM

  // Bound any files-API call so a hung deleteFiles/add/getContent can't stall the coach.
  const delay = (ms) => new Promise((r) => setTimeout(r, ms));

  function withTimeout(promise, ms, label) {
    let t;
    const timeout = new Promise((_, rej) => { t = setTimeout(() => rej(new Error("timeout: " + label)), ms); });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(t));
  }

  // ============================================================
  // Workspace reading. Covers both Grade 8 CS units: plain main.py projects,
  // CSV/text data files, notes like data_story.md and model-notes.txt, and the
  // course helper libraries (mlms.py, simple_llm.py, simple_image_llm.py).
  // codioIDE.workspace does NOT exist in the Custom Assistant runtime —
  // codioIDE.files is the supported channel, and getContext().files only lists
  // files open in the editor. getStructure() returns a name->value MAP: a
  // file's value is a leaf (Codio uses 1), a directory's value is a nested map.
  // ============================================================

  const TOTAL_BUDGET = 40000;       // chars of file context per ask()
  const MAX_CODE_FILE = 15000;      // a student's own .py / notes file
  const SMALL_DATA_FILE = 3000;     // data files at or under this are sent whole
  const PREVIEW_ROWS = 5;           // data rows shown for a bigger CSV
  const PREVIEW_LINES = 15;         // lines shown for a bigger text file

  // Course tools: summarised to their functions rather than sent as source.
  const HELPER_LIBS = ["mlms.py", "simple_llm.py", "simple_image_llm.py"];
  // Repo/teacher files that must never reach the LLM (TEACHER_README can hold answers).
  const SKIP_NAMES = ["readme.md", "claude.md", "teacher_readme.md", "template_version", "agents.md"];
  const SKIP_DIRS = ["__pycache__", "node_modules", "venv"];
  const TEXT_EXTS = [".py", ".csv", ".txt", ".md", ".json", ".tsv"];

  function normalizePath(p) {
    return String(p).replace(/^\.\//, '').replace(/^\//, '');
  }

  function baseName(p) {
    const parts = normalizePath(p).split('/');
    return parts[parts.length - 1];
  }

  function extOf(p) {
    const name = baseName(p).toLowerCase();
    const dot = name.lastIndexOf('.');
    return dot < 0 ? '' : name.slice(dot);
  }

  // Every non-hidden file path in the project. Dot-files and dot-dirs (.guides,
  // .codio, .coach-log.json, .git) are skipped — .guides/secure holds solutions.
  function collectPaths(node, path) {
    let out = [];
    if (!node || typeof node !== 'object') return out;
    for (const name in node) {
      if (!Object.prototype.hasOwnProperty.call(node, name)) continue;
      if (name.startsWith('.')) continue;
      const fullPath = path ? `${path}/${name}` : name;
      const value = node[name];
      if (value && typeof value === 'object') {
        if (SKIP_DIRS.indexOf(name) >= 0) continue;
        out = out.concat(collectPaths(value, fullPath));
      } else if (SKIP_NAMES.indexOf(name.toLowerCase()) < 0) {
        out.push(fullPath);
      }
    }
    return out;
  }

  function isHelperLib(p) {
    return HELPER_LIBS.indexOf(baseName(p).toLowerCase()) >= 0;
  }

  // Order: student code (main.py first), then notes, then data, then helpers.
  function fileRank(p) {
    const ext = extOf(p);
    if (isHelperLib(p)) return 4;
    if (ext === '.py') return baseName(p).toLowerCase() === 'main.py' ? 0 : 1;
    if (ext === '.md' || baseName(p).toLowerCase() === 'model-notes.txt') return 2;
    return 3;
  }

  // Class and function signatures plus the first lines of each docstring —
  // enough for the LLM to know what a helper offers without its whole source.
  function extractApi(src) {
    const lines = String(src).split(/\r?\n/);
    const out = [];
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(/^(\s*)(class|def)\s+([A-Za-z_]\w*)/);
      if (!m || m[3].startsWith('_')) continue;
      let sig = lines[i].replace(/\s+$/, '');
      // Signatures can wrap across lines until the closing "):"
      let j = i;
      while (!/:\s*(#.*)?$/.test(lines[j]) && j + 1 < lines.length && j - i < 6) {
        j++;
        sig += ' ' + lines[j].trim();
      }
      out.push(sig);
      let k = j + 1;
      while (k < lines.length && lines[k].trim() === '') k++;
      if (k < lines.length && /^\s*("""|''')/.test(lines[k])) {
        const indent = lines[k].match(/^\s*/)[0];
        const quote = lines[k].trim().slice(0, 3);
        const first = lines[k].trim().slice(3);
        const doc = [];
        if (first.indexOf(quote) >= 0) {
          doc.push(first.slice(0, first.indexOf(quote)));
        } else {
          if (first) doc.push(first);
          for (let d = k + 1; d < lines.length && doc.length < 8; d++) {
            if (lines[d].indexOf(quote) >= 0) {
              const before = lines[d].slice(0, lines[d].indexOf(quote)).trim();
              if (before) doc.push(before);
              break;
            }
            doc.push(lines[d].trim());
          }
        }
        doc.filter(s => s).forEach(s => out.push(indent + '    # ' + s));
      }
    }
    return out.join('\n');
  }

  function previewData(path, content) {
    const lines = String(content).split(/\r?\n/);
    while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();
    if (content.length <= SMALL_DATA_FILE) {
      return `File: ${path} (${lines.length} lines, complete)\n${lines.join('\n')}`;
    }
    const ext = extOf(path);
    if (ext === '.csv' || ext === '.tsv') {
      const rows = lines.length - 1;
      return `File: ${path} (PREVIEW: header + first ${PREVIEW_ROWS} of ${rows} data rows)\n` +
        lines.slice(0, PREVIEW_ROWS + 1).join('\n');
    }
    return `File: ${path} (PREVIEW: first ${PREVIEW_LINES} of ${lines.length} lines)\n` +
      lines.slice(0, PREVIEW_LINES).join('\n');
  }

  // Turn one file into the text the LLM sees, or null when the content isn't text.
  function summarizeFile(path, content) {
    if (typeof content !== 'string') return null;
    const ext = extOf(path);
    const name = baseName(path).toLowerCase();
    // An empty starter file is meaningful: the student hasn't begun yet.
    if (content.length === 0) return `File: ${path}\n(empty file)`;
    if (isHelperLib(path)) {
      const api = extractApi(content);
      return `Course helper library: ${path} (functions only; students don't edit this)\n${api || '(no public functions found)'}`;
    }
    if (ext === '.py' || ext === '.md' || name === 'model-notes.txt') {
      if (content.length <= MAX_CODE_FILE) return `File: ${path}\n${content}`;
      return `File: ${path}\n${content.slice(0, MAX_CODE_FILE)}\n(cut off after ${MAX_CODE_FILE} characters)`;
    }
    return previewData(path, content);
  }

  // Build the <files> block: every readable file summarised, every other file
  // (images, .tm models) listed by name so the coach knows it exists. Every files-API
  // read is time-bounded; a read that fails or times out lands on the "Not shown" line.
  async function readWorkspace(openFiles) {
    const F = codioIDE.files;
    const openMap = {};
    const openBad = {};  // open tabs whose content isn't a string: try the saved copy instead
    (openFiles || []).forEach(f => {
      if (!f || !f.path) return;
      if (typeof f.content === 'string') openMap[normalizePath(f.path)] = f.content;
      else openBad[normalizePath(f.path)] = true;
    });

    let paths = [];
    if (F && typeof F.getStructure === 'function') {
      try {
        paths = collectPaths(await withTimeout(F.getStructure(), 8000, "structure"), '');
      } catch (e) {
        paths = [];
      }
    }
    // Open editor files count even if getStructure() is unavailable.
    Object.keys(openMap).concat(Object.keys(openBad)).forEach(p => {
      if (paths.indexOf(p) < 0 && !baseName(p).startsWith('.') &&
          SKIP_NAMES.indexOf(baseName(p).toLowerCase()) < 0) paths.push(p);
    });
    paths = paths.map(normalizePath);
    paths.sort((a, b) => fileRank(a) - fileRank(b) || a.localeCompare(b));

    const sections = [];   // {p, text}; priority order decides what fits, display is sorted by path
    let used = 0;
    const listOnly = [];
    const notShown = [];
    for (const p of paths) {
      if (TEXT_EXTS.indexOf(extOf(p)) < 0) { listOnly.push(p); continue; }
      if (used >= TOTAL_BUDGET) { notShown.push(p); continue; }
      let content = openMap[p];
      if (content === undefined && F && typeof F.getContent === 'function') {
        try { content = await withTimeout(F.getContent(p), 8000, "read " + p); } catch (e) { content = undefined; }
      }
      let text = summarizeFile(p, content);
      if (!text) { notShown.push(p); continue; }  // unreadable: failed, timed out, or non-text
      if (used + text.length > TOTAL_BUDGET) {
        const keep = Math.max(0, TOTAL_BUDGET - used);
        text = text.slice(0, keep) + `\n(cut off after ${keep} characters)`;
      }
      sections.push({ p: p, text: text });
      used += text.length;
    }

    sections.sort((a, b) => a.p.localeCompare(b.p));
    const listing = paths.length ? paths.slice().sort((a, b) => a.localeCompare(b)).join('\n') : '(no files found)';
    let out = sections.map(x => x.text).join('\n\n');
    if (listOnly.length) out += `\n\nOther files (not shown):\n${listOnly.slice().sort().join('\n')}`;
    if (notShown.length) out += `\n\nNot shown (too long to include, or couldn't be read): ${notShown.slice().sort().join(', ')}`;
    return `All files in the project:\n${listing}\n\n${out || 'No readable files.'}`;
  }

  // register(id, name, function) — id kept from the Data Stories Coach so
  // existing Codio course settings keep pointing at this button.
  codioIDE.coachBot.register("dataStoriesHelp", "Data & AI Coach", onButtonPress);

  // Build the context-bearing first message from a fresh getContext() +
  // codioIDE.files read. Re-run before every ask() so the coach sees the
  // student's latest edits, not their files as of the button press.
  // The exact files text from the latest build (between the <files> tags), kept so
  // the turn loop can fingerprint it and tell whether the student's files changed.
  let lastFilesBlock = "";

  async function buildContextMessage(initialInput, isRefresh, history, session) {
    let context;
    try {
      context = await withTimeout(codioIDE.coachBot.getContext(), 8000, "context");
    } catch (e) {
      // On a refresh keep the previous context (the caller handles the throw);
      // on the first turn fall back to no open-tab files.
      if (isRefresh) throw e;
      context = { files: [] };
    }
    context = context || { files: [] };
    const filesContent = await readWorkspace(context.files);
    lastFilesBlock = filesContent;

    const guideContent = (context.guidesPage && context.guidesPage.content)
      ? context.guidesPage.content
      : "No guide available.";

    const assignmentName = (context.assignmentData && context.assignmentData.name)
      ? context.assignmentData.name
      : null;

    return `Here are the student's project files (current as of their latest question):
<files>
${filesContent}
</files>
Here is the assignment guide:
<guide>
${guideContent}
</guide>
${session ? recentQuestionsBlock(history, session) + '\n' : ''}${assignmentName ? `\nAssignment: ${assignmentName}\n` : ''}
${isRefresh
  ? `(The student's first question in this chat was: ${initialInput}. Their newest message is the last one below.)`
  : `The student says: ${initialInput}`}`;
  }

  // Context used when the files couldn't be read at all, so the coach still answers.
  function fallbackContext(question, history, session) {
    return `Here are the student's project files:
<files>
(I couldn't read the student's files just now.)
</files>
${session ? recentQuestionsBlock(history, session) + '\n' : ''}
The student says: ${question}`;
  }

  // Exposed only for test/run-test.js; unused inside Codio.
  window.__dataCoachTest = { collectPaths, extractApi, summarizeFile, readWorkspace, buildContextMessage, systemPrompt, isExitMessage, fingerprint, readModeTag, historyReply };

  // ============================================================
  // Session log — a hidden, shared workspace file (.coach-log.json) that every
  // coach appends to (one entry per session, tagged with `coach`), summarizing
  // how students use the coaches. Dot-prefixed so it never enters the LLM
  // context. Deliberately records the student's questions: Codio's own course
  // coach-log export logs only the userPrompt field, which is empty for
  // messages-based coaches like these — this file is where the questions live.
  // Sessions are never dropped (always appended). Logging is wrapped so it can
  // never break the coach.
  // ============================================================

  const SESSION_LOG_PATH = ".coach-log.json";
  const COACH_ID = "datastories";
  const MAX_LOGGED_QUESTIONS = 50;

  // Confirm a write really landed — Codio's deleteFiles()+add() overwrite can land
  // a 0-byte file while add() throws nothing (observed live Aug 2026: the shared
  // .coach-log.json was wiped to 0 bytes). Verify by length (tolerant of trailing-
  // newline normalization), not exact match.
  async function readbackOk(F, path, content) {
    if (typeof F.getContent !== "function") return true;
    try {
      const got = await withTimeout(F.getContent(path), 8000, "read " + path);
      return typeof got === "string" && got.length > 0 && got.length >= content.length - 4;
    } catch (e) {
      return false;
    }
  }

  // Write and VERIFY. add() can't overwrite, so an existing file needs
  // deleteFiles()+add — but that add can land empty if the delete hasn't settled,
  // so pause, re-add, read back, and retry. Never reports success on an empty write.
  async function addVerified(F, path, content) {
    try {
      await withTimeout(F.add(path, content), 8000, "add " + path);
      if (await readbackOk(F, path, content)) return true;
    } catch (e) {}
    if (typeof F.deleteFiles !== "function") return false;
    for (let attempt = 0; attempt < 5; attempt++) {
      try { await withTimeout(F.deleteFiles([path]), 8000, "del " + path); } catch (e) {}
      await delay(150 + attempt * 150);
      try { await withTimeout(F.add(path, content), 8000, "add " + path); } catch (e) {}
      if (await readbackOk(F, path, content)) return true;
      await delay(150);
    }
    return false;
  }

  async function saveSessionHistory(history) {
    const F = codioIDE.files;
    if (!F || typeof F.add !== "function") return;
    const text = JSON.stringify(history, null, 2);
    await addVerified(F, SESSION_LOG_PATH, text);
  }

  // Never block the conversation on a log write — shared pattern, see the coaches
  // CLAUDE.md "Session Logging". saveSessionHistory() is a full read-modify-rewrite
  // (deleteFiles + add) of the shared log; awaiting it in the turn loop means a
  // stalled write freezes the coach with no input box. queueSave() serializes
  // writes on a promise chain (overlapping fire-and-forget saves can't corrupt the
  // file) and is called WITHOUT await each turn; only the end-of-session flush is awaited.
  let saveChain = Promise.resolve();
  function queueSave(history) {
    saveChain = saveChain.then(function() { return saveSessionHistory(history); }).catch(function() {});
    return saveChain;
  }


  // Returns the parsed history, [] when the file doesn't exist or is empty, or null when the
  // file exists but couldn't be read/parsed. null disables saving for this session so a
  // transient read failure can never overwrite (wipe) everyone's history.
  async function loadSessionHistory() {
    const F = codioIDE.files;
    if (!F || typeof F.getContent !== "function") return null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const text = await withTimeout(F.getContent(SESSION_LOG_PATH), 8000, "read log");
        if (typeof text !== "string" || !text.trim()) return [];
        const parsed = JSON.parse(text);
        return Array.isArray(parsed) ? parsed : null;
      } catch (e) {
        await delay(300);
      }
    }
    // Both reads failed: only start fresh if the file really isn't there.
    try {
      if (typeof F.getStructure === "function") {
        const tree = await withTimeout(F.getStructure(), 8000, "structure");
        if (tree && typeof tree === "object" && Object.keys(tree).length > 0 && !(SESSION_LOG_PATH in tree)) return [];
      }
    } catch (e) {}
    return null;
  }

  // Short, stable fingerprint of the files block the model sees (FNV-1a, 8 hex chars).
  // Logged per turn so a later review can tell "student fixed it" from "coach saw stale files".
  function fingerprint(text) {
    const s = String(text || "");
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return { len: s.length, hash: ("0000000" + h.toString(16)).slice(-8) };
  }

  // ============================================================
  // Try-first help (strict mode), with the model's judgment and the code's memory.
  // Each reply starts with a hidden tag labelling the student's CURRENT message:
  // [[ask]] (wants the next step, the code or a check instead of trying), [[attempt]]
  // (shows or describes their own try), or [[other]]. The code keeps those labels in
  // the box's log and, before every reply, tells the model in <recent_questions> which
  // kind of help each label gets this turn: try-first when this would be the 3rd ask
  // in their last 5 questions since their last attempt, or while try-first is already on (until an attempt).
  // The tag is stripped before the student sees the reply (ask() runs with
  // stream:false, then write()) and kept in the chat history so the model keeps
  // tagging. Backstop: STRICT_SESSION_QUESTIONS questions in a session means try-first.
  // The log is per box (one student, one assignment), so nothing carries over.
  // ============================================================
  const STRICT_SESSION_QUESTIONS = 10; // backstop: questions in the current session
  const STRICT_WORKSPACE_DAYS = 14;    // only sessions that started within this many days
  const TRY_FIRST_ASKS = 3;            // asks among the last TRY_FIRST_WINDOW questions that switch it on
  const TRY_FIRST_WINDOW = 5;
  const RECENT_QUESTIONS_SHOWN = 10;   // questions listed in <recent_questions>
  const RECENT_QUESTION_CHARS = 160;   // each one cut to this length
  const MODE_LABELS = ["ask", "attempt", "other"];

  // This coach's recent questions in this box (last STRICT_WORKSPACE_DAYS days, this
  // session included), each with the label the model gave it (null if none yet).
  function recentQuestionList(history, session) {
    let total = 0;
    let items = [];
    const list = Array.isArray(history) ? history : [];
    for (let i = 0; i < list.length; i++) {
      const s = list[i];
      if (!s || typeof s !== "object" || s.coach !== COACH_ID) continue;
      const startedMs = Date.parse(s.started);
      if (s !== session && !(startedMs > Date.now() - STRICT_WORKSPACE_DAYS * 86400000)) continue;
      const qs = Array.isArray(s.questions) ? s.questions : [];
      const labels = Array.isArray(s.labels) ? s.labels : [];
      total += (typeof s.exchanges === "number" && s.exchanges >= qs.length) ? s.exchanges : qs.length;
      for (let j = 0; j < qs.length; j++) {
        if (typeof qs[j] === "string") items.push({ q: qs[j], label: MODE_LABELS.indexOf(labels[j]) !== -1 ? labels[j] : null });
      }
    }
    return { total: total, items: items };
  }

  // Which help each possible label of the CURRENT question gets this turn.
  function modeRule(history, session) {
    const recent = recentQuestionList(history, session);
    let prior = recent.items.slice(0, -1).slice(-(TRY_FIRST_WINDOW - 1));
    let lastAttempt = -1;
    prior.forEach(function(it, i) { if (it.label === "attempt") lastAttempt = i; });
    prior = prior.slice(lastAttempt + 1); // an attempt starts the count over
    const priorAsks = prior.filter(function(it) { return it.label === "ask"; }).length;
    const modes = Array.isArray(session.modes) ? session.modes : [];
    const lastMode = modes.length ? modes[modes.length - 1] : "normal";
    if ((session.exchanges || 0) >= STRICT_SESSION_QUESTIONS) {
      return { ask: "try-first", attempt: "try-first", other: "try-first", backstop: true, recent: recent };
    }
    return {
      ask: (priorAsks + 1 >= TRY_FIRST_ASKS || lastMode === "try-first") ? "try-first" : "normal",
      attempt: "normal",
      other: lastMode === "try-first" ? "try-first" : "normal",
      backstop: false,
      recent: recent
    };
  }

  // The <recent_questions> block for messages[0]. Rebuilt every turn after recordTurn().
  function recentQuestionsBlock(history, session) {
    const rule = modeRule(history, session);
    const shown = rule.recent.items.slice(-RECENT_QUESTIONS_SHOWN).map(function(it, i, arr) {
      const one = it.q.replace(/\s+/g, " ").trim();
      const cut = one.length > RECENT_QUESTION_CHARS ? one.slice(0, RECENT_QUESTION_CHARS) + "..." : one;
      const tag = (i === arr.length - 1) ? "[current]" : "[" + (it.label || "?") + "]";
      return (i + 1) + ". " + tag + " " + cut;
    });
    const big = function(m) { return m === "try-first" ? "TRY-FIRST help" : "NORMAL help"; };
    return "<recent_questions>\n" +
      "Questions to you in this assignment in the last " + STRICT_WORKSPACE_DAYS + " days: " + rule.recent.total +
      ". In this session: " + (session.exchanges || 0) + ".\n" +
      (shown.length ? "Their recent questions, oldest first, with the label you gave each:\n" + shown.join("\n") : "No earlier questions.") +
      "\nFor the current question, label it and give this help:\n" +
      "- [[ask]]: " + big(rule.ask) + "\n" +
      "- [[attempt]]: " + big(rule.attempt) + "\n" +
      "- [[other]]: " + big(rule.other) + "\n" +
      "</recent_questions>";
  }

  // Reads and strips the hidden tag line. Returns the label (null if missing) and the
  // cleaned text. Tolerates ** or backtick wrappers, # or >, one closing bracket, a
  // trailing colon, and extra words like "[[ask | try-first]]".
  function readModeTag(reply) {
    const text = String(reply || "");
    const nl = text.search(/\n|$/);
    const first = text.slice(0, nl);
    let label = null;
    let rest = text;
    // Strip only the tag itself, so "[[ask]] What did you try?" keeps its words.
    const lead = first.match(/^\s*[#*_`> \t]*\[\[\s*(ask|attempt|other|try-first|normal)\b([^\]\n]{0,30}\]\]|\]{0,2})[*_`:]*[ \t]*/i);
    if (lead) {
      const w = lead[1].toLowerCase();
      label = MODE_LABELS.indexOf(w) !== -1 ? w : null;
      rest = first.slice(lead[0].length) + text.slice(nl);
    }
    const clean = rest
      .replace(/[*_`]*\[\[\s*(ask|attempt|other|try-first|normal)(\s*\|[^\]\n]{0,30})?\s*\]\][*_`:]*[ \t]*/gi, "") // stray copies
      .replace(/^\s+/, "");
    return { label: label, text: clean };
  }

  // The chat-history copy of a reply keeps its tag line (only the student's view is
  // cleaned), so the model keeps seeing itself tag every reply.
  function historyReply(tagged) {
    return "[[" + (tagged.label || "other") + "]]\n" + tagged.text;
  }

  // Call after every non-empty reply, with the rule used for this turn (from
  // modeRule(), computed when this turn's context was built) and the tag read from the
  // reply. Logs the label and the mode; the next queued save carries them.
  function recordMode(session, rule, label) {
    const mode = rule[label || "other"];
    if (!Array.isArray(session.labels)) session.labels = [];
    if (!Array.isArray(session.modes)) session.modes = [];
    // labels line up with questions: pad for any earlier question that got no reply
    while (session.labels.length < (session.questions || []).length - 1) session.labels.push(null);
    while (session.modes.length < session.labels.length) session.modes.push(null);
    if (session.labels.length < MAX_LOGGED_QUESTIONS) session.labels.push(label);
    if (session.modes.length < MAX_LOGGED_QUESTIONS) session.modes.push(mode);
    if (mode === "try-first") {
      session.strictReleased = false;
      if (!session.strict) {
        session.strict = true;
        session.strictReason = rule.backstop ? "backstop" : "model";
      }
    } else if (session.strict) {
      session.strictReleased = true; // went back to normal help after try-first
    }
    return mode;
  }

  const TRY_FIRST_PROMPT = `

## Try-first help: label each message

Each message includes <recent_questions>: the student's recent questions to you in this assignment and the label you gave each one. Start EVERY reply with one hidden tag line that labels the student's CURRENT message, then your reply on the next line:
- [[ask]]: they want you to give them the next step, the code, or a check instead of trying something themselves. Judge the meaning in any wording: "now what", "how do I do that", "what goes next", "can you tell me how to...", "is this right?", "like that?", "show me", "say the instructions easier", "what are all the steps", a bare paste with no question.
- [[attempt]]: THIS message shows or describes something new they tried since your last reply (what they changed, what happened when they ran it, or their own plan), or it starts with the note that their files changed. Code that was already in their files does not make a message an attempt.
- [[other]]: anything else, including pasting a real error message, asking what something means or how something works, asking how to run their code, asking where to find a block, menu or button, or answering a question you asked.
Label the student's words, not their files. Examples: "how do I do that" [[ask]]; "like that?" [[ask]]; "show me" [[ask]]; "and then" [[ask]]; "NameError: name 'x' is not defined" [[other]]; "what does int() do?" [[other]]; "I added an if but it prints both times" [[attempt]]; "I think I should use a loop that adds 1 each time" [[attempt]].
Then give the kind of help <recent_questions> lists for that label. The student never sees the tag. Never mention it, the labels, the mode, or their question count.

Try-first help means: stay warm and keep helping with every question, but nudge them to try first.
- Same as always: explain what an error message means and which line it points to, explain an idea, give a short example with different names or data, point out a typo or missing punctuation, help them find a block, menu or button, and tell them how to run their work.
- For "what do I write", "next" or "show me" questions, first ask one short question back ("What do you think the next step is?" or "What did you try?") and wait for their answer. If they answer with a real attempt, even a wrong one, help as usual from there.
- Don't write the lesson's main step in their own work (their condition, their loop, their counter, their blocks). Show the pattern with different names and let them adapt it. If they ask twice for that step, give a parallel example, not their finished line. Fixing a typo or missing punctuation in a line they already wrote is still fine.
- After about three "next step" asks in a row, suggest they run what they have and see what happens, or ask them to explain their plan in one sentence.
- If they've been stuck on the same thing for three or more turns, kindly suggest their teacher, for example: "This one might be easier to sort out with your teacher. If you're in class, ask them now. If you're working at home, send them a message about where you're stuck." That's a suggestion, never a refusal. Keep helping too.
- Never mention a mode, a limit or how many questions they've asked, and never refuse. You're a coach who wants them to try first.`;

  const fullSystemPrompt = systemPrompt + TRY_FIRST_PROMPT;

  async function onButtonPress() {
    codioIDE.coachBot.write(
      `Data & AI Coach v${VERSION} - Ask me about your code, your data, or your model!`,
      codioIDE.coachBot.MESSAGE_ROLES.ASSISTANT
    );

    const GOODBYE = "Okay, bye! Come back any time you want help.";
    let messages = [];

    let initialInput;
    while (true) {
      try {
        initialInput = await codioIDE.coachBot.input("What can I help you with?");
        if (typeof initialInput !== "string") initialInput = "";
      } catch (e) {
        codioIDE.coachBot.showMenu();
        return;
      }

      if ((initialInput || "").trim().toLowerCase() === "version") {
        codioIDE.coachBot.write(`Current version: ${VERSION}`, codioIDE.coachBot.MESSAGE_ROLES.ASSISTANT);
        continue;
      }

      // A blank message is ignored.
      if (!(initialInput || "").trim()) continue;

      // The very first message can already be a goodbye: no ask(), no log session.
      if (isExitMessage(initialInput)) {
        codioIDE.coachBot.write(GOODBYE);
        codioIDE.coachBot.showMenu();
        return;
      }

      break;
    }

    let sessionHistory;
    try {
      codioIDE.coachBot.showThinkingAnimation();  // the first log read can take a moment
      sessionHistory = await loadSessionHistory();
    } catch (e) {
      sessionHistory = null;
    } finally {
      codioIDE.coachBot.hideThinkingAnimation();
    }
    const logEnabled = sessionHistory !== null;
    if (!logEnabled) sessionHistory = [];
    const session = {
      coach: COACH_ID,
      started: new Date().toISOString(),
      updated: null,
      ended: null,
      coachVersion: VERSION,
      exchanges: 0,
      failedReplies: 0,
      questions: [],
      contextFingerprints: [],
      strict: false,
      strictReason: null,
      strictReleased: false,
      modes: [],
      labels: []
    };
    sessionHistory.push(session);

    async function recordTurn(question) {
      session.exchanges += 1;
      if (session.questions.length < MAX_LOGGED_QUESTIONS) {
        session.questions.push(String(question).slice(0, 300));
      }
      session.updated = new Date().toISOString();
      if (logEnabled) queueSave(sessionHistory); // fire-and-forget: never block the input loop on a log write
    }

    // Baseline for "the files changed": the hash the model last ANSWERED about. Kept outside
    // the capped contextFingerprints array, and advanced only after a non-empty reply, so a
    // failed or empty turn leaves it and the retry still gets the note.
    let lastAnsweredHash = null;
    let pendingHash = null;

    // Fingerprint the files block from the latest buildContextMessage() and log it.
    // ok=false means the context build/refresh failed: log an aligned placeholder entry.
    // Returns true when the hash differs from the last answered one.
    function logFingerprint(ok) {
      let entry;
      let changed = false;
      if (ok) {
        const fp = fingerprint(lastFilesBlock);
        changed = lastAnsweredHash !== null && lastAnsweredHash !== fp.hash;
        pendingHash = fp.hash;
        entry = { len: fp.len, hash: fp.hash, changed: changed };
      } else {
        pendingHash = null;
        entry = { len: null, hash: null, changed: false, refreshFailed: true };
      }
      if (session.contextFingerprints.length < MAX_LOGGED_QUESTIONS) session.contextFingerprints.push(entry);
      return changed;
    }

    await recordTurn(initialInput);

    let firstContext;
    let firstOk = true;
    try {
      firstContext = await buildContextMessage(initialInput, false, sessionHistory, session);
    } catch (e) {
      firstOk = false;
      firstContext = fallbackContext(initialInput, sessionHistory, session);
    }
    logFingerprint(firstOk);
    messages.push({ "role": "user", "content": firstContext });

    if (DEBUG_MODE) {
      codioIDE.coachBot.write("**DEBUG - context sent (" + firstContext.length + " chars):**\n```\n" + firstContext.slice(0, 4000) + "\n```");
    }

    try {
      codioIDE.coachBot.showThinkingAnimation();
      const result = await codioIDE.coachBot.ask({
        systemPrompt: fullSystemPrompt,
        messages: messages
      }, { stream: false, preventMenu: true });
      const rule = modeRule(sessionHistory, session);  // same state this turn's context block was built from
      const raw = (result && typeof result.result === "string") ? result.result : "";
      const tagged = readModeTag(raw);
      if (!tagged.text.trim()) {
        // Never keep an empty assistant turn: an empty message in the history can make every
        // later ask() fail too (seen live: one session got 10 empty replies in a row).
        session.failedReplies = (session.failedReplies || 0) + 1;
        codioIDE.coachBot.write("Hmm, I didn't get an answer that time. Please ask again!");
        messages.pop();          // drop the user turn that got no answer
      } else {
        recordMode(session, rule, tagged.label);
        codioIDE.coachBot.write(tagged.text, codioIDE.coachBot.MESSAGE_ROLES.ASSISTANT);
        messages.push({ "role": "assistant", "content": historyReply(tagged) });  // the tag is kept in history
        if (pendingHash !== null) lastAnsweredHash = pendingHash;
      }
    } catch (e) {
      session.failedReplies = (session.failedReplies || 0) + 1;
      codioIDE.coachBot.write("Hmm, something went wrong on my end. Try asking that again!");
      messages.pop();
    } finally {
      codioIDE.coachBot.hideThinkingAnimation();
    }

    while (true) {
      let input;
      try {
        input = await codioIDE.coachBot.input("What else can I help you with? (Type 'bye' when you're done.)");
        if (typeof input !== "string") input = "";
      } catch (e) {
        break;
      }

      if ((input || "").trim().toLowerCase() === "version") {
        codioIDE.coachBot.write(`Current version: ${VERSION}`, codioIDE.coachBot.MESSAGE_ROLES.ASSISTANT);
        continue;
      }

      // A blank message is ignored.
      if (!(input || "").trim()) continue;

      if (isExitMessage(input)) {
        break;
      }

      await recordTurn(input);

      let changed = false;
      if (messages.length === 0) {
        // The first ask failed, so this question becomes the context-bearing first message.
        initialInput = input;
        let ctx;
        let ok = true;
        try {
          ctx = await buildContextMessage(input, false, sessionHistory, session);
        } catch (e) {
          ok = false;
          ctx = fallbackContext(input, sessionHistory, session);
        }
        logFingerprint(ok);
            messages.push({ "role": "user", "content": ctx });
      } else {
        // Refresh the context block so the coach sees the student's latest edits
        try {
          const refreshed = await buildContextMessage(initialInput, true, sessionHistory, session);
          messages[0] = { "role": "user", "content": refreshed };
          changed = logFingerprint(true);
        } catch (e) {
          // Keep the previous context if the refresh fails (and treat files as unchanged)
          logFingerprint(false);
        }
            messages.push({
          "role": "user",
          "content": (changed ? "(Note: the student's files have changed since your last reply.)\n\n" : "") + input
        });
      }

      try {
        codioIDE.coachBot.showThinkingAnimation();
        const result = await codioIDE.coachBot.ask({
          systemPrompt: fullSystemPrompt,
          messages: messages
        }, { stream: false, preventMenu: true });
        const rule = modeRule(sessionHistory, session);  // same state this turn's context block was built from
        const raw = (result && typeof result.result === "string") ? result.result : "";
        const tagged = readModeTag(raw);
        if (!tagged.text.trim()) {
          session.failedReplies = (session.failedReplies || 0) + 1;
          codioIDE.coachBot.write("Hmm, I didn't get an answer that time. Please ask again!");
          messages.pop();        // drop the user turn that got no answer
          continue;
        } else {
          recordMode(session, rule, tagged.label);
          codioIDE.coachBot.write(tagged.text, codioIDE.coachBot.MESSAGE_ROLES.ASSISTANT);
          messages.push({ "role": "assistant", "content": historyReply(tagged) });  // the tag is kept in history
          if (pendingHash !== null) lastAnsweredHash = pendingHash;
        }
      } catch (e) {
        session.failedReplies = (session.failedReplies || 0) + 1;
        codioIDE.coachBot.write("Hmm, something went wrong on my end. Try asking that again!");
        messages.pop();
        continue;
      } finally {
        codioIDE.coachBot.hideThinkingAnimation();
      }

      // Keep first message (with files + guide) + last 8 messages (4 exchanges)
      while (messages.length > 9) {
        messages.splice(1, 2); // drop the oldest assistant+user pair, keep messages[0] (context) intact
      }
    }

    session.ended = new Date().toISOString();
    if (logEnabled) await queueSave(sessionHistory); // flush queued writes (safe to await — no input follows)

    codioIDE.coachBot.write(GOODBYE);
    codioIDE.coachBot.showMenu();
  }
})(window.codioIDE, window);
