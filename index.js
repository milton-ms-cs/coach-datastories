// Wrapping the whole extension in a JS function
// (ensures all global variables set in this extension cannot be referenced outside its scope)
(async function(codioIDE, window) {

  const VERSION = "2.0.0";

  const systemPrompt = `You are the Data & AI Coach, a friendly coding coach for 8th grade computer science students. They write Python in two units:
- **Unit 1, Python with Data:** lists, slicing, reading text and CSV files with open(), strip() and split(), counting with dictionaries, functions and return values, recursion, charts with matplotlib, and a Data Stories milestone (ask a question of a real dataset, answer it with an average and two charts, and write it up in data_story.md).
- **Unit 2, Data and Machine Learning:** training an image model in Teachable Machine, text classifiers and recommenders (mlms), generating text from word pairs, calling a language model (simple_llm), prompt engineering, image generation (simple_image_llm), and an Ethical Assistant milestone.

## What you can see

The <files> tags hold the student's Python files and notes in full, a preview (header plus first rows) of each data file, the functions in any course helper library, and a list of every file in the project. The <guide> tags hold the guide page they have open. Read both before answering. If you only have a preview of a data file, say so rather than guessing about rows you can't see.

## How to help

- Keep it short: 2-3 sentences for a simple question, one short paragraph for a bigger idea, never more than 250 words. Write at an 8th grade reading level and be encouraging.
- Teach the way the guide does. This course reads CSV files with open(), strip() and split(), not the csv module or pandas. Use the same tools and style the guide uses, even if another way also works.
- Never write a complete program, a whole function the assignment asks for, or a full solution. Short examples (3-5 lines) that show an idea are fine, ideally with different names or data than theirs.

**Diagnosing — be direct and specific.** Error messages, typos, a missing colon or bracket, an off-by-one index: say what the error means in plain words and point to the exact line. A broken single line is a small fix, and you may show the corrected line. Be exact ("add .strip() before .split(',') on line 7"), never vague. Never refuse something you already showed earlier in the conversation. If they misread a hint, explain it a new way rather than repeating it. If they've asked about the same small bug twice and are still stuck, show the fixed line and say why it works.

**Solving — make THEM do the work.** "How do I find the average of a column?" or "Write the function that counts…" are design questions. Explain the idea, give a tiny example on different data, and ask them to try the first step.

**Interpreting data is theirs.** "What does my chart show?" or "What should my data story say?" — ask what they notice, point them to a comparison or an outlier, and help them put their own idea into words. Don't write their conclusion.

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
- With chat(), forgetting to add both the user message and the bot's reply to history after each turn — chat() does not change history itself.
- Recursion without a base case, which ends in RecursionError.

## Where students work: Codio

Students write and run their code in Codio. You can't run anything yourself, but you always know how THEY can:
- Click the **▶ Run** button in the menu bar at the top of Codio (it runs python3 main.py). If the program uses input(), they type their answer in the terminal that opens.
- Or open a terminal (Tools > Terminal) and type python3 main.py, using the real file name from the <files> tags if it isn't main.py.
- Charts and generated images are saved as files; open them from the file tree on the left.
- If a student asks "can you run this?" or "how do I run it?", tell them exactly that. Don't say it depends on their editor or website.

The one exception is **Teachable Machine**, which is a separate website, not part of Codio. Students right-click the .tm file in the Codio file tree to download it, open it at teachablemachine.withgoogle.com (Open Project), train and test there, then paste their share link and results into model-notes.txt back in Codio. Those lessons have no code to run, so help with the ideas: classes, training examples, and why the model is or isn't sure.

## When to send them to the teacher

Suggest asking the teacher when something really needs a human: Codio itself seems broken (the button does nothing, files are missing, they can't Mark as Complete), a language-model or image call fails with a connection, key or permission error that isn't caused by their code, questions about grades or deadlines, the student is upset or frustrated, or anything about their wellbeing or safety. Don't use "ask your teacher" to dodge a question about their code or about Codio that you can answer.`;

  const exitPhrases = ["thanks", "thank you", "bye", "done", "exit", "quit", "stop", "no thanks", "i'm good", "im good", "that's all", "thats all"];

  const DEBUG_MODE = false;  // Set to true to see the context sent to the LLM

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

  // Turn one file into the text the LLM sees, or null to just list it by name.
  function summarizeFile(path, content) {
    const ext = extOf(path);
    const name = baseName(path).toLowerCase();
    // An empty starter file is meaningful: the student hasn't begun yet.
    if (content === '' && (ext === '.py' || ext === '.md' || name === 'model-notes.txt') && !isHelperLib(path)) {
      return `File: ${path}\n(empty — nothing written yet)`;
    }
    if (typeof content !== 'string' || content.length === 0) return null;
    if (isHelperLib(path)) {
      const api = extractApi(content);
      return `Course helper library: ${path} (functions only; students don't edit this)\n${api || '(no public functions found)'}`;
    }
    if (ext === '.py' || ext === '.md' || name === 'model-notes.txt') {
      if (content.length <= MAX_CODE_FILE) return `File: ${path}\n${content}`;
      return `File: ${path} (truncated)\n${content.slice(0, MAX_CODE_FILE)}\n...(truncated)`;
    }
    return previewData(path, content);
  }

  // Build the <files> block: every readable file summarised, every other file
  // (images, .tm models) listed by name so the coach knows it exists.
  async function readWorkspace(openFiles) {
    const F = codioIDE.files;
    const openMap = {};
    (openFiles || []).forEach(f => {
      if (f && f.path && typeof f.content === 'string') openMap[normalizePath(f.path)] = f.content;
    });

    let paths = [];
    if (F && typeof F.getStructure === 'function') {
      try {
        paths = collectPaths(await F.getStructure(), '');
      } catch (e) {
        paths = [];
      }
    }
    // Open editor files count even if getStructure() is unavailable.
    Object.keys(openMap).forEach(p => {
      if (paths.indexOf(p) < 0 && !baseName(p).startsWith('.') &&
          SKIP_NAMES.indexOf(baseName(p).toLowerCase()) < 0) paths.push(p);
    });
    paths = paths.map(normalizePath);
    paths.sort((a, b) => fileRank(a) - fileRank(b) || a.localeCompare(b));

    const sections = [];
    let used = 0;
    const listOnly = [];
    for (const p of paths) {
      if (TEXT_EXTS.indexOf(extOf(p)) < 0) { listOnly.push(p); continue; }
      if (used >= TOTAL_BUDGET) { listOnly.push(p + ' (not shown: too much text)'); continue; }
      let content = openMap[p];
      if (content === undefined && F && typeof F.getContent === 'function') {
        try { content = await F.getContent(p); } catch (e) { content = undefined; }
      }
      let text = summarizeFile(p, content);
      if (!text) { listOnly.push(p + (content === '' ? ' (empty)' : '')); continue; }
      if (used + text.length > TOTAL_BUDGET) {
        text = text.slice(0, Math.max(0, TOTAL_BUDGET - used)) + '\n...(truncated)';
      }
      sections.push(text);
      used += text.length;
    }

    const listing = paths.length ? paths.join('\n') : '(no files found)';
    let out = sections.join('\n\n');
    if (listOnly.length) out += `\n\nOther files (not shown):\n${listOnly.join('\n')}`;
    return `All files in the project:\n${listing}\n\n${out || 'No readable files.'}`;
  }

  // register(id, name, function) — id kept from the Data Stories Coach so
  // existing Codio course settings keep pointing at this button.
  codioIDE.coachBot.register("dataStoriesHelp", "Data & AI Coach", onButtonPress);

  // Build the context-bearing first message from a fresh getContext() +
  // codioIDE.files read. Re-run before every ask() so the coach sees the
  // student's latest edits, not their files as of the button press.
  async function buildContextMessage(initialInput) {
    const context = await codioIDE.coachBot.getContext();
    const filesContent = await readWorkspace(context.files);

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
${assignmentName ? `\nAssignment: ${assignmentName}\n` : ''}
The student says: ${initialInput}`;
  }

  // Exposed only for test/run-test.js; unused inside Codio.
  window.__dataCoachTest = { collectPaths, extractApi, summarizeFile, readWorkspace, buildContextMessage, systemPrompt };

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

  async function loadSessionHistory() {
    const F = codioIDE.files;
    if (!F || typeof F.getContent !== "function") return [];
    try {
      const parsed = JSON.parse(await F.getContent(SESSION_LOG_PATH));
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  // Bound any files-API call so a hung deleteFiles/add/getContent can't stall the coach.
  const delay = (ms) => new Promise((r) => setTimeout(r, ms));

  function withTimeout(promise, ms, label) {
    let t;
    const timeout = new Promise((_, rej) => { t = setTimeout(() => rej(new Error("timeout: " + label)), ms); });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(t));
  }

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


  async function onButtonPress() {
    codioIDE.coachBot.write(
      `Data & AI Coach v${VERSION} - Ask me about your code, your data, or your model!`,
      codioIDE.coachBot.MESSAGE_ROLES.ASSISTANT
    );

    let messages = [];

    let initialInput;
    while (true) {
      try {
        initialInput = await codioIDE.coachBot.input("What can I help you with?");
      } catch (e) {
        codioIDE.coachBot.showMenu();
        return;
      }

      if (initialInput === "version") {
        codioIDE.coachBot.write(`Current version: ${VERSION}`, codioIDE.coachBot.MESSAGE_ROLES.ASSISTANT);
        continue;
      }

      break;
    }

    const sessionHistory = await loadSessionHistory();
    const session = {
      coach: COACH_ID,
      started: new Date().toISOString(),
      updated: null,
      ended: null,
      coachVersion: VERSION,
      exchanges: 0,
      questions: []
    };
    sessionHistory.push(session);

    async function recordTurn(question) {
      session.exchanges += 1;
      if (session.questions.length < MAX_LOGGED_QUESTIONS) {
        session.questions.push(String(question).slice(0, 300));
      }
      session.updated = new Date().toISOString();
      queueSave(sessionHistory); // fire-and-forget: never block the input loop on a log write
    }

    await recordTurn(initialInput);

    let firstContext;
    try {
      firstContext = await buildContextMessage(initialInput);
    } catch (e) {
      firstContext = `The student's files could not be read. Ask them to paste the code or describe what they're working on.\n\nThe student says: ${initialInput}`;
    }
    messages.push({ "role": "user", "content": firstContext });

    if (DEBUG_MODE) {
      codioIDE.coachBot.write("**DEBUG - context sent (" + firstContext.length + " chars):**\n```\n" + firstContext.slice(0, 4000) + "\n```");
    }

    try {
      codioIDE.coachBot.showThinkingAnimation();
      const result = await codioIDE.coachBot.ask({
        systemPrompt: systemPrompt,
        messages: messages
      }, {preventMenu: true});
      messages.push({"role": "assistant", "content": result.result});
    } catch (e) {
      codioIDE.coachBot.write("Hmm, something went wrong on my end. Try asking that again!");
      messages.pop();
    } finally {
      codioIDE.coachBot.hideThinkingAnimation();
    }

    while (true) {
      let input;
      try {
        input = await codioIDE.coachBot.input("What else can I help you with? (Say 'thanks' when you're done!)");
      } catch (e) {
        break;
      }

      if (input === "version") {
        codioIDE.coachBot.write(`Current version: ${VERSION}`, codioIDE.coachBot.MESSAGE_ROLES.ASSISTANT);
        continue;
      }

      const trimmedInput = input.trim().toLowerCase();
      if (exitPhrases.includes(trimmedInput)) {
        break;
      }

      await recordTurn(input);

      // If the first ask failed, this question becomes the context-bearing first message
      if (messages.length === 0) {
        initialInput = input;
        messages.push({ "role": "user", "content": firstContext });
      } else {
        messages.push({ "role": "user", "content": input });
      }

      // Refresh the context block so the coach sees the student's latest edits
      try {
        messages[0] = { "role": "user", "content": await buildContextMessage(initialInput) };
      } catch (e) {
        // Keep the previous context if the refresh fails
      }

      try {
        codioIDE.coachBot.showThinkingAnimation();
        const result = await codioIDE.coachBot.ask({
          systemPrompt: systemPrompt,
          messages: messages
        }, {preventMenu: true});
        messages.push({"role": "assistant", "content": result.result});
      } catch (e) {
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
    await queueSave(sessionHistory); // flush queued writes (safe to await — no input follows)

    codioIDE.coachBot.write("You're welcome! Come back any time you're stuck.");
    codioIDE.coachBot.showMenu();
  }
})(window.codioIDE, window);
