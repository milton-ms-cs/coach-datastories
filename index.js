// Wrapping the whole extension in a JS function
// (ensures all global variables set in this extension cannot be referenced outside its scope)
(async function(codioIDE, window) {

  const systemPrompt = `You are a friendly and helpful data science coach for middle school students working on "Data Stories" projects using Jupyter notebooks.

When helping students:
- Keep responses short — 2-3 sentences for simple questions, a short paragraph for bigger concepts.
- Use plain language: "This line loads your data from the CSV file" not "This invokes the data ingestion pipeline."
- Be encouraging: "Great question!", "You're really close!", "Nice start!"
- Always look at the student's actual notebook code (in <notebook> tags) before answering.
- Reference the assignment guide (in <guide> tags) to understand what they're working on.
- Reference their actual code when you can see it.

What you CAN do:
- Explain what an error message means in plain language.
- Point out bugs in their code and suggest specific fixes.
- Write short example snippets (3-5 lines) using ds_helpers or pandas, with explanations of each line.
- Help them understand their data and what it means.
- Give specific code they can copy and paste, with explanations of what it does.

What you CANNOT do:
- Write their entire data story or complete notebook sections for them.
- Do their homework for them. If they ask, say: "I can't write that for you, but let me help you figure it out! What part are you stuck on?"
- Answer questions outside of course content.

## Mechanics vs. interpretation

There are two very different kinds of help here, and you should treat them differently.

**Mechanics — be direct and specific. Just show them:**
- Syntax errors, tracebacks, and column name issues (e.g. KeyError, ds.col() not finding a match) — explain what's wrong and point to the line.
- ds_helpers/pandas syntax: how to call a function, what arguments it takes, fixing a typo in a method name.
- Code that won't run because of indentation, a missing parenthesis, or a wrong variable name.

For these, just give them the working code or fix — pandas/ds_helpers syntax is not the learning objective here, so it's fine to hand it over directly.

**Interpretation — make THEM do the thinking:**
- "What does this chart show?" / "Why is the average so high?" / "What's the story here?" — these are reasoning questions, not syntax questions. Don't answer for them. Ask a leading question instead: "What do you notice when you compare the two bars?" or "What might explain that outlier?"
- "What should my data story say?" — don't write their conclusion. Ask what they noticed in the data and help them put it into words themselves.
- "Is this a good chart?" — ask what story they're trying to tell, then help them evaluate whether the chart shows it.

The data reasoning is the assignment. The pandas/ds_helpers syntax is just the tool to get there — be generous with the tool, but make them own the thinking.

## ds_helpers.py Function Reference

**Data Loading & Cleaning:**
- ds.load_clean('file.csv') - Loads CSV/Excel, auto-cleans column names, converts data types
- ds.clean_columns(df) - Converts headers to snake_case
- ds.alias_columns(df) - Creates short, student-friendly column aliases

**Column Discovery:**
- ds.columns_guide(df) - Shows mapping: alias <- original column name
- ds.col(df, 'search_term') - Fuzzy column finder (finds partial matches)

**Data Exploration:**
- ds.browse(df) - Interactive widget for filtering/exploring data
- ds.roles(df) - Categorizes columns (numeric, dates, categorical)

**Simple Plotting:**
- ds.bar_chart(df, 'column', 'title') - Creates bar charts
- ds.scatter_plot(df, 'x_col', 'y_col', 'title') - Creates scatter plots
- ds.line_plot(df, 'x_col', 'y_col', 'title') - Creates line plots

**Utilities:**
- ds.collapse_small_categories(series, top_n=10) - Groups low-frequency categories

## Common student challenges:
- Forgetting to use column aliases shown by columns_guide()
- Difficulty with fuzzy column matching syntax
- Not understanding the difference between mean and median
- Creating meaningful chart titles and labels
- Writing data stories that connect numbers to real-world meaning

When students have column name issues, ask them to paste the output of ds.columns_guide(df).`;

  const exitPhrases = ["thanks", "thank you", "bye", "done", "exit", "quit", "stop", "no thanks", "i'm good", "im good", "that's all", "thats all"];

  // Configuration
  const VERSION = "1.7.1";
  const DEBUG_MODE = false;  // Set to true to see debug output

  // Try to read supporting files (python helpers, CSVs, other notebooks) via
  // codioIDE.files. codioIDE.workspace does NOT exist in the Custom Assistant
  // runtime — codioIDE.files is the supported channel:
  // https://codio.github.io/client/codioIDE.files.html
  async function tryGetWorkspaceFiles(skipPaths) {
    let filesContext = "";
    const totalBudget = 40000;
    const F = codioIDE.files;
    if (!F || typeof F.getStructure !== "function" || typeof F.getContent !== "function") {
      return filesContext;
    }

    let relevantFiles = [];
    try {
      relevantFiles = findRelevantFiles(await F.getStructure(), '');
    } catch (error) {
      return filesContext;
    }

    for (const filePath of relevantFiles) {
      if (filesContext.length >= totalBudget) {
        break;
      }
      if (skipPaths && skipPaths.has(normalizePath(filePath))) {
        continue;
      }

      try {
        const content = await F.getContent(filePath);
        const maxLength = Math.min(15000, totalBudget - filesContext.length);

        if (typeof content === 'string' && content.length > 0) {
          if (content.length <= maxLength) {
            filesContext += `\nFile: ${filePath}\n${content}\n`;
          } else {
            filesContext += `\nFile: ${filePath} (truncated)\n${content.substring(0, maxLength)}\n...(truncated)\n`;
          }
        }
      } catch (err) {
        // Silent
      }
    }

    return filesContext;
  }

  function normalizePath(p) {
    return String(p).replace(/^\.\//, '').replace(/^\//, '');
  }

  // Find relevant files (notebooks, python files, CSVs).
  // getStructure() returns a name->value MAP: a file's value is a leaf (Codio
  // uses 1), a directory's value is a nested map — not an array of nodes.
  function findRelevantFiles(node, path) {
    let files = [];
    if (!node || typeof node !== 'object') return files;

    for (const name in node) {
      if (!Object.prototype.hasOwnProperty.call(node, name)) continue;
      if (name.startsWith('.')) continue;
      const fullPath = path ? `${path}/${name}` : name;
      const value = node[name];

      if (value && typeof value === 'object') {
        files = files.concat(findRelevantFiles(value, fullPath));
      } else {
        const lower = name.toLowerCase();
        if (lower.endsWith('.ipynb') || lower.endsWith('.py') || lower.endsWith('.csv')) {
          files.push(fullPath);
        }
      }
    }

    return files;
  }

  // Extract content from open Jupyter notebooks
  function extractNotebookContent(jupyterContext) {
    let content = "";

    for (let i = 0; i < jupyterContext.length; i++) {
      const notebook = jupyterContext[i];
      content += `\nNotebook: ${notebook.path}\n`;

      notebook.content.forEach((cell, index) => {
        if (cell.type === 'code' || cell.type === 'markdown') {
          content += `\nCell ${index + 1} (${cell.type}):\n${cell.content || ''}\n`;
        }
      });
    }

    return content;
  }

  // register(id, name, function)
  codioIDE.coachBot.register("dataStoriesHelp", "Data Stories Coach", onButtonPress);

  // Build the context-bearing first message from a fresh getContext() +
  // codioIDE.files read. Re-run before every ask() so the coach sees the
  // student's latest edits, not their notebook as of the button press.
  // Throws if no notebook is open so a refresh can keep the previous context.
  async function buildContextMessage(initialInput) {
    const context = await codioIDE.coachBot.getContext();

    if (!context.jupyterContext || context.jupyterContext.length === 0) {
      throw new Error("no open notebook");
    }

    // Build notebook context from open Jupyter notebooks
    const notebookContent = extractNotebookContent(context.jupyterContext);

    // Try to get additional project files (skip notebooks already open —
    // their content is in jupyterContext, and the raw .ipynb JSON is bulky)
    const openPaths = new Set(
      context.jupyterContext.map(nb => normalizePath(nb.path))
        .concat((context.files || []).map(f => normalizePath(f.path)))
    );
    const workspaceFiles = await tryGetWorkspaceFiles(openPaths);

    let filesContent = notebookContent;
    if (workspaceFiles) {
      filesContent += '\n' + workspaceFiles;
    }

    const guideContent = (context.guidesPage && context.guidesPage.content)
      ? context.guidesPage.content
      : "No guide available.";

    const assignmentName = (context.assignmentData && context.assignmentData.name)
      ? context.assignmentData.name
      : null;

    return `Here is the student's open notebook and workspace files (current as of their latest question):
<notebook>
${filesContent}
</notebook>
Here is the assignment guide:
<guide>
${guideContent}
</guide>
${assignmentName ? `\nAssignment: ${assignmentName}\n` : ''}
The student says: ${initialInput}`;
  }

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

  async function saveSessionHistory(history) {
    const F = codioIDE.files;
    if (!F || typeof F.add !== "function") return;
    const text = JSON.stringify(history, null, 2);
    try {
      await F.add(SESSION_LOG_PATH, text);
    } catch (e) {
      // add() rejects when the file exists — delete and re-add
      try {
        if (typeof F.deleteFiles !== "function") return;
        await F.deleteFiles([SESSION_LOG_PATH]);
        await F.add(SESSION_LOG_PATH, text);
      } catch (e2) {
        // Logging must never break the coach
      }
    }
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
      `Data Stories Coach v${VERSION} - Ask me about your data story!`,
      codioIDE.coachBot.MESSAGE_ROLES.ASSISTANT
    );

    const context = await codioIDE.coachBot.getContext();

    if (DEBUG_MODE) {
      codioIDE.coachBot.write("**DEBUG - Context received:**");
      codioIDE.coachBot.write("```json\n" + JSON.stringify(context, null, 2) + "\n```");
    }

    // Check if any Jupyter notebooks are open
    if (!context.jupyterContext || context.jupyterContext.length === 0) {
      codioIDE.coachBot.write("**Please open a Jupyter notebook first!**\n\nI can help you better when I can see your code. Please open one of your notebook files (Step One, Step Two, etc.) and then click the coach button again.");
      codioIDE.coachBot.showMenu();
      return;
    }

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

    messages.push({
      "role": "user",
      "content": await buildContextMessage(initialInput)
    });

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

      messages.push({
        "role": "user",
        "content": input
      });

      // Refresh the context block so the coach sees the student's latest edits
      try {
        messages[0] = { "role": "user", "content": await buildContextMessage(initialInput) };
      } catch (e) {
        // Keep the previous context if the refresh fails (e.g. notebook closed)
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

      // Keep first message (with notebook + guide) + last 8 messages (4 exchanges)
      while (messages.length > 9) {
        messages.splice(1, 2); // drop the oldest assistant+user pair, keep messages[0] (context) intact
      }
    }

    session.ended = new Date().toISOString();
    await queueSave(sessionHistory); // flush queued writes (safe to await — no input follows)

    codioIDE.coachBot.write("You're welcome! Please feel free to ask any more questions about this course!");
    codioIDE.coachBot.showMenu();
  }
})(window.codioIDE, window);
