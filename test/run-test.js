// Node test harness for the Data & AI Coach.
// Usage: node test/run-test.js   (Node 18+)
//
// Builds in-memory Codio workspaces shaped like the real Grade 8 CS boxes
// (a Unit 1 Data Stories milestone, a Unit 2 chatbot lesson, a Unit 2
// Teachable Machine lesson), stubs codioIDE, evals index.js, and checks what
// the coach would send the LLM. The helper libraries in test/fixtures are
// copies of the real ones from the box repos.

const fs = require("fs");
const path = require("path");

const FIX = path.join(__dirname, "fixtures");
const fixture = (name) => fs.readFileSync(path.join(FIX, name), "utf8");

let failures = 0;
const T0 = Date.now();
function check(label, cond) {
  if (process.env.TIMING) console.log('      [' + (Date.now() - T0) + 'ms]');
  if (cond) { console.log("  ok  " + label); }
  else { console.error("  FAIL " + label); failures++; }
}

// --- workspaces: flat path -> content maps ---------------------------------

function bigCsv(rows) {
  const lines = ["title,author,rating,year"];
  for (let i = 0; i < rows; i++) lines.push(`Book ${i},Author ${i % 50},${(3 + (i % 20) / 10).toFixed(1)},${1950 + (i % 70)}`);
  return lines.join("\n") + "\n";
}

const SECRET = "SECRET_TEACHER_ANSWER_42";

const milestone = {
  "main.py": "# Do longer books get better ratings?\nimport matplotlib\nmatplotlib.use(\"Agg\")\nimport matplotlib.pyplot as plt\n\nf = open(\"goodreads.csv\")\nheader = f.readline().strip().split(\",\")\nprint(header)\n",
  "data_story.md": "# My data story\n\nTODO\n",
  "goodreads.csv": bigCsv(9979),
  "mlb_batting_2024.csv": "team,hr,runs\nNYY,237,815\nLAD,233,842\n",
  "chart.png": "\u0089PNG...",
  "README.md": "Repo readme",
  "TEACHER_README.md": "Answer key: " + SECRET,
  "CLAUDE.md": "agent notes",
  "TEMPLATE_VERSION": "2026.09.26",
  ".guides/secure/solution/main.py": "print('" + SECRET + "')",
  ".guides/content/Coding-0002.md": "guide source " + SECRET,
  ".coach-log.json": "[]",
  "__pycache__/main.cpython-312.pyc": "bytes"
};

const chatbot = {
  "main.py": fixture("chatbot_main.py"),
  "simple_llm.py": fixture("simple_llm.py"),
  "TEACHER_README.md": "Answer key: " + SECRET
};

const recommender = {
  "main.py": "from mlms import TextRecommender\n\nrec = TextRecommender()\n",
  "mlms.py": fixture("mlms.py"),
  "simple_image_llm.py": fixture("simple_image_llm.py")
};

const teachable = {
  "model-notes.txt": "Share link:\nPhoto 1:\n",
  "sharks-and-dolphins.tm": "PK\u0003\u0004binary",
  "TEACHER_README.md": "Answer key: " + SECRET
};

// --- codioIDE stub ----------------------------------------------------------

function toStructure(files) {
  const root = {};
  for (const p of Object.keys(files)) {
    const parts = p.split("/");
    let node = root;
    for (let i = 0; i < parts.length - 1; i++) node = node[parts[i]] = node[parts[i]] || {};
    node[parts[parts.length - 1]] = 1;
  }
  return root;
}

const env = {
  files: {},
  openFiles: [],
  guide: "Print the column names, the number of rows, and one sample row.",
  inputs: [],
  asks: [],
  writes: [],
  hangWrites: false,
  overwriteOk: true  // the stub lets add() overwrite so saves stay fast; the real API rejects (addVerified handles that)
};

global.window = {
  codioIDE: {
    coachBot: {
      register: function(id, label, fn) { env.registered = { id, label, fn }; },
      MESSAGE_ROLES: { ASSISTANT: "assistant" },
      write: function(t) { env.writes.push(t); },
      showMenu: function() {},
      showThinkingAnimation: function() {},
      hideThinkingAnimation: function() {},
      getContext: async function() {
        return { files: env.openFiles, guidesPage: { content: env.guide }, assignmentData: { name: "Data Stories" } };
      },
      input: async function() {
        if (!env.inputs.length) throw new Error("no more input");
        return env.inputs.shift();
      },
      ask: async function(req) {
        env.asks.push(JSON.parse(JSON.stringify(req)));
        return { result: "reply " + env.asks.length };
      }
    },
    files: {
      getStructure: async function() { return toStructure(env.files); },
      getContent: async function(p) {
        if (!(p in env.files)) throw new Error("not found: " + p);
        return env.files[p];
      },
      add: async function(p, c) {
        if (env.hangWrites) return new Promise(function(r) { env.releaseHang = r; });
        if (p in env.files && !env.overwriteOk) throw new Error("exists");
        env.files[p] = c;
      },
      deleteFiles: async function(ps) { ps.forEach(function(p) { delete env.files[p]; }); }
    }
  }
};

eval(fs.readFileSync(path.join(__dirname, "..", "index.js"), "utf8"));

(async function() {
  const t = global.window.__dataCoachTest;
  if (!t) { console.error("FAIL: index.js did not expose __dataCoachTest"); process.exit(1); }

  console.log("Registration");
  check("button keeps the dataStoriesHelp id", env.registered.id === "dataStoriesHelp");
  check("button is labelled Data & AI Coach", env.registered.label === "Data & AI Coach");

  console.log("Unit 1 milestone");
  env.files = Object.assign({}, milestone);
  let ctx = await t.buildContextMessage("why is my chart blank?");
  check("main.py sent in full", ctx.indexOf('header = f.readline().strip().split(",")') >= 0);
  check("data_story.md sent", ctx.indexOf("# My data story") >= 0);
  check("big CSV previewed, not dumped", ctx.indexOf("goodreads.csv (PREVIEW: header + first 5 of 9979 data rows)") >= 0 && ctx.indexOf("Book 500,") < 0);
  check("small CSV sent complete", ctx.indexOf("mlb_batting_2024.csv (3 lines, complete)") >= 0 && ctx.indexOf("LAD,233,842") >= 0);
  check("chart.png listed by name", /Other files \(not shown\):[\s\S]*chart\.png/.test(ctx));
  check("teacher/solution/guide-source content never sent", ctx.indexOf(SECRET) < 0);
  check("README/CLAUDE/TEMPLATE_VERSION skipped", ctx.indexOf("Repo readme") < 0 && ctx.indexOf("agent notes") < 0 && ctx.indexOf("TEMPLATE_VERSION") < 0);
  check("dot files and __pycache__ skipped", ctx.indexOf(".coach-log.json") < 0 && ctx.indexOf("__pycache__") < 0);
  check("files are shown in path order (stable fingerprint)", ctx.indexOf("File: data_story.md") < ctx.indexOf("File: main.py"));
  check("guide included", ctx.indexOf("<guide>\nPrint the column names") >= 0);
  check("context stays under budget", ctx.length < 45000);

  console.log("Empty starter file");
  env.files = Object.assign({}, milestone, { "main.py": "" });
  ctx = await t.buildContextMessage("where do I start?");
  check("empty main.py shown as an empty file", ctx.indexOf("File: main.py\n(empty file)") >= 0);
  env.files = Object.assign({}, milestone);

  console.log("Open editor buffer wins over saved file");
  env.openFiles = [{ path: "main.py", content: "print('unsaved edit')\n" }];
  ctx = await t.buildContextMessage("q");
  check("open buffer content used", ctx.indexOf("print('unsaved edit')") >= 0 && ctx.indexOf("header = f.readline()") < 0);
  env.openFiles = [];

  console.log("Unit 2 chatbot lesson");
  env.files = Object.assign({}, chatbot);
  ctx = await t.buildContextMessage("my bot forgets things");
  check("student chatbot code sent", ctx.indexOf("reply = chat(system_prompt, history, user_message)") >= 0);
  check("simple_llm summarised as helper", ctx.indexOf("Course helper library: simple_llm.py") >= 0);
  check("chat() signature present", ctx.indexOf("def chat(system_prompt, history, user_message):") >= 0);
  check("chat() docstring note present", ctx.indexOf("This function does NOT modify history.") >= 0);
  check("helper source body not sent", ctx.indexOf("client.chat.completions.create") < 0 && ctx.indexOf("OPENAI_API_KEY") < 0);

  console.log("Unit 2 recommender + image helpers");
  env.files = Object.assign({}, recommender);
  ctx = await t.buildContextMessage("q");
  check("TextRecommender class listed", /class TextRecommender/.test(ctx));
  check("TextClassifier.train listed", /def train\(self, training_data\)/.test(ctx));
  check("private helpers hidden", !/def _/.test(ctx));
  check("generate_image signature listed", ctx.indexOf("def generate_image(system_prompt, user_message, filename=None):") >= 0);
  check("mlms not sent as full source", ctx.length < fixture("mlms.py").length);

  console.log("Unit 2 Teachable Machine lesson");
  env.files = Object.assign({}, teachable);
  ctx = await t.buildContextMessage("what does training do?");
  check("model-notes.txt sent", ctx.indexOf("Share link:") >= 0);
  check(".tm file listed, not dumped", /Other files \(not shown\):[\s\S]*sharks-and-dolphins\.tm/.test(ctx) && ctx.indexOf("binary") < 0);

  console.log("Files API unavailable");
  const savedFiles = global.window.codioIDE.files;
  global.window.codioIDE.files = undefined;
  env.openFiles = [{ path: "main.py", content: "print('only open file')" }];
  ctx = await t.buildContextMessage("q");
  check("falls back to open editor files", ctx.indexOf("print('only open file')") >= 0);
  global.window.codioIDE.files = savedFiles;
  env.openFiles = [];

  console.log("System prompt");
  const sp = t.systemPrompt;
  ["Where students work: Codio", "When to send them to the teacher", "Teachable Machine", "is a separate website",
   "Prompts are their work", "A strange model answer is usually not a bug", "plt.savefig", "not the csv module or pandas",
   "Interpreting data is theirs", "You always see their latest work", "About this chat and about you", "Short programs: one line can be the whole answer",
   "First, check the assignment", "Guide questions are theirs", "header.index(\"ColumnName\")", "always true", "(Type 'bye' when you're done.)"].forEach(function(s) { check("prompt mentions: " + s, sp.indexOf(s) >= 0); });
  check("prompt no longer mentions ds_helpers or notebooks", !/ds_helpers|Jupyter|notebook/i.test(sp));

  console.log("Full conversation");
  env.files = Object.assign({}, milestone);
  env.inputs = ["why is my chart blank?", "ok I changed it", "thanks"];
  env.asks = []; env.writes = [];
  await env.registered.fn();
  check("banner shows new name", env.writes[0].indexOf("Data & AI Coach v") === 0);
  check("two ask() calls", env.asks.length === 2);
  check("no notebook gate", env.writes.join(" ").indexOf("open a Jupyter notebook") < 0);
  check("first ask carries files + question", env.asks[0].messages[0].content.indexOf("why is my chart blank?") >= 0);
  check("follow-up re-reads files", env.asks[1].messages[0].content.indexOf("File: main.py") >= 0 && env.asks[1].messages.length === 3);
  const log = JSON.parse(env.files[".coach-log.json"]);
  const entry = log[log.length - 1];
  check("session logged under datastories id", entry.coach === "datastories" && entry.exchanges === 2 && entry.ended);

  console.log("Hanging log write can't freeze the loop");
  env.files = Object.assign({}, chatbot, { ".coach-log.json": "[]" });
  env.inputs = ["q1", "q2", "thanks"];
  env.asks = [];
  env.hangWrites = true;
  const hungRun = env.registered.fn();
  await new Promise(function(r) { setTimeout(r, 300); });
  check("both turns ran despite a hanging log write", env.asks.length === 2);
  // Release the stuck write and let that session finish so it can't bleed into later tests.
  env.hangWrites = false;
  if (env.releaseHang) env.releaseHang();
  await hungRun;

  console.log("isExitMessage");
  ["thanks!", "ok bye", "no thanks", "no thanks \u{1F642}", "i\u2019m good thanks", "thank you so much", "that's all", "stop", "done"].forEach(function(m) {
    check("exits: " + m, t.isExitMessage(m));
  });
  ["thanks still broken", "im done with loops", "im good at this", "stop button doesn't work", "thanks, but why is line 3 wrong?", "ok", "good", "   ", null].forEach(function(m) {
    check("stays open: " + m, !t.isExitMessage(m));
  });

  // Conversation helper: run the coach with scripted inputs and ask() results.
  async function converse(files, inputs, replies, between) {
    env.files = Object.assign({}, files);
    if (!(".coach-log.json" in env.files)) env.files[".coach-log.json"] = "[]";
    env.openFiles = [];
    env.inputs = inputs.slice();
    env.asks = []; env.writes = [];
    const origAsk = global.window.codioIDE.coachBot.ask;
    let n = 0;
    global.window.codioIDE.coachBot.ask = async function(req) {
      env.asks.push(JSON.parse(JSON.stringify(req)));
      const r = replies[n++];
      if (between) between(n);
      if (r instanceof Error) throw r;
      if (r === null) return {};  // result object with no string
      return { result: r === undefined ? "reply " + n : r };
    };
    await env.registered.fn();
    global.window.codioIDE.coachBot.ask = origAsk;
    const log = JSON.parse(env.files[".coach-log.json"] || "[]");
    return log[log.length - 1];
  }

  console.log("First message that is a goodbye");
  let e0 = await converse(chatbot, ["thanks!"], []);
  check("no ask() and no log session", env.asks.length === 0 && e0 === undefined);
  check("neutral goodbye text", env.writes.indexOf("Okay, bye! Come back any time you want help.") >= 0);

  console.log("Follow-up prompt text");
  let inputsSeen = [];
  const origInput = global.window.codioIDE.coachBot.input;
  global.window.codioIDE.coachBot.input = async function(prompt) { inputsSeen.push(prompt); return origInput(); };
  await converse(chatbot, ["q1", "bye"], []);
  global.window.codioIDE.coachBot.input = origInput;
  check("first prompt unchanged", inputsSeen[0] === "What can I help you with?");
  check("follow-up prompt says bye", inputsSeen[1] === "What else can I help you with? (Type 'bye' when you're done.)");

  console.log("Empty ask() result never enters history");
  let e1 = await converse(chatbot, ["q1", "q2", "ok bye"], ["", "real answer"]);
  check("empty first reply: user turn dropped, second ask has one message", env.asks[1].messages.length === 1);
  check("recovered: new question is in the rebuilt context", env.asks[1].messages[0].content.indexOf("The student says: q2") >= 0);
  check("no empty assistant message ever sent", env.asks.every(function(a) { return a.messages.every(function(m) { return m.content !== "" && m.content !== undefined; }); }));
  check("told the student to ask again", env.writes.some(function(w) { return w.indexOf("didn't get an answer") >= 0; }));
  check("failedReplies logged", e1.failedReplies === 1);
  let e2 = await converse(chatbot, ["q1", "q2", "q3", "bye"], ["a1", null, "a3"]);
  check("follow-up with result lacking a string is dropped", env.asks[2].messages.length === 3 && env.asks[2].messages[2].content.indexOf("q3") >= 0);
  let e3 = await converse(chatbot, ["q1", "q2", "bye"], [new Error("Cancelled"), "fine"]);
  check("thrown ask counted and recovered", e3.failedReplies === 1 && env.asks[1].messages.length === 1);

  console.log("Refreshed context does not re-ask the first question");
  await converse(chatbot, ["first question here", "second question here", "bye"], []);
  check("first turn says The student says", env.asks[0].messages[0].content.indexOf("The student says: first question here") >= 0);
  check("refresh labels it as the first question", env.asks[1].messages[0].content.indexOf("The student's first question in this chat was: first question here") >= 0 && env.asks[1].messages[0].content.indexOf("The student says:") < 0);

  console.log("Files-changed note");
  const NOTE = "(Note: the student's files have changed since your last reply.)";
  let e4 = await converse(chatbot, ["q1", "q2", "q3", "bye"], [], function(n) {
    if (n === 2) env.files["main.py"] = env.files["main.py"] + "\nprint('edited')\n";
  });
  check("no note when files unchanged", env.asks[1].messages[2].content === "q2");
  check("note when files changed", env.asks[2].messages[4].content === NOTE + "\n\nq3");
  check("logged question stays raw", e4.questions[2] === "q3");
  check("contextFingerprints logged per turn", e4.contextFingerprints.length === 3 && /^[0-9a-f]{8}$/.test(e4.contextFingerprints[0].hash));
  check("fingerprint changed flags", e4.contextFingerprints[0].changed === false && e4.contextFingerprints[1].changed === false && e4.contextFingerprints[2].changed === true);

  console.log("Files-changed baseline (R2)");
  // 55 turns, an edit appears before turn 52: note on turn 52 only, even past the 50-entry cap.
  const many = ["bye"]; const manyInputs = []; for (let i = 1; i <= 55; i++) manyInputs.push("q" + i); manyInputs.push("bye");
  await converse(chatbot, manyInputs, [], function(n) { if (n === 51) env.files["main.py"] += "\nprint('late edit')\n"; });
  const noteTurns = env.asks.map(function(a, i) { const m = a.messages[a.messages.length - 1].content; return m.indexOf(NOTE) === 0 ? i + 1 : null; }).filter(Boolean);
  check("note only on the turn after the edit, even past 50 turns", noteTurns.length === 1 && noteTurns[0] === 52);
  // A failed turn leaves the baseline, so the retry still gets the note.
  await converse(chatbot, ["q1", "q2", "q2 again", "bye"], ["a1", new Error("boom"), "a3"], function(n) {
    if (n === 1) env.files["main.py"] += "\nprint('edit')\n";
  });
  check("retry after a failed turn still carries the note", env.asks[2].messages[env.asks[2].messages.length - 1].content.indexOf(NOTE) === 0);
  // Refresh failure: placeholder entry keeps entries aligned, no note.
  let refreshBreak = false;
  const origGetContext = global.window.codioIDE.coachBot.getContext;
  let gcCalls = 0;
  global.window.codioIDE.coachBot.getContext = async function() {
    gcCalls++;
    if (gcCalls === 2) return { files: [], get guidesPage() { throw new Error("guide broke"); } };
    return origGetContext();
  };
  let e5 = await converse(chatbot, ["q1", "q2", "bye"], []);
  global.window.codioIDE.coachBot.getContext = origGetContext;
  check("refresh failure logs a placeholder, sends no note", e5.contextFingerprints.length === 2 && e5.contextFingerprints[1].refreshFailed === true && e5.contextFingerprints[1].hash === null && env.asks[1].messages[2].content === "q2");

  console.log("Order-independent context (R3)");
  const origStructure = global.window.codioIDE.files.getStructure;
  env.files = Object.assign({}, chatbot, { "b.py": "b = 1\n", "a.py": "a = 1\n" });
  const ctxA = await t.buildContextMessage("q", false);
  global.window.codioIDE.files.getStructure = async function() {
    const st = toStructure(env.files); const rev = {}; Object.keys(st).reverse().forEach(function(k) { rev[k] = st[k]; }); return rev;
  };
  const ctxB = await t.buildContextMessage("q", false);
  global.window.codioIDE.files.getStructure = origStructure;
  check("same files block whatever the key order", ctxA === ctxB);

  console.log("Empty, cut off and unreadable files (R6)");
  env.files = Object.assign({}, chatbot, { "empty.py": "", "huge.py": "q = 1\n".repeat(5000), "notes.md": "hi" });
  env.openFiles = [{ path: "notes.md", content: undefined }, { path: "main.py", content: 42 }];
  const origGet = global.window.codioIDE.files.getContent;
  global.window.codioIDE.files.getContent = async function(p) { if (p === "simple_llm.py") throw new Error("boom"); return origGet(p); };
  ctx = await t.buildContextMessage("q", false);
  global.window.codioIDE.files.getContent = origGet;
  env.openFiles = [];
  check("empty file is shown", ctx.indexOf("File: empty.py\n(empty file)") >= 0);
  check("cut file has a marker and is not on the Not shown line", ctx.indexOf("(cut off after 15000 characters)") >= 0 && !/Not shown \(too long[^\n]*huge\.py/.test(ctx));
  check("unreadable file is on the Not shown line", /Not shown \(too long to include, or couldn't be read\): [^\n]*simple_llm\.py/.test(ctx));
  check("non-string open tab falls back to saved copy, never prints undefined", ctx.indexOf("hi") >= 0 && ctx.indexOf("undefined") < 0 && ctx.indexOf("reply = chat(") >= 0);
  check("prompt explains cut off vs not shown", t.systemPrompt.indexOf("marks a file as cut off") >= 0);

  console.log("First context build failure (R5)");
  global.window.codioIDE.coachBot.getContext = async function() { return { files: [], get guidesPage() { throw new Error("guide broke"); } }; };
  let e6 = await converse(chatbot, ["help please", "bye"], []);
  global.window.codioIDE.coachBot.getContext = origGetContext;
  check("coach still answers with a no-files context", env.asks.length === 1 && env.asks[0].messages[0].content.indexOf("couldn't read the student's files") >= 0 && env.asks[0].messages[0].content.indexOf("The student says: help please") >= 0);
  check("question is logged and fingerprint placeholder kept", e6.questions[0] === "help please" && e6.contextFingerprints[0].refreshFailed === true);

  console.log("Blank input and version");
  await converse(chatbot, ["   ", "version", "q1", "", "version", "bye"], []);
  check("blank ignored, version answered, one ask", env.asks.length === 1 && env.writes.filter(function(w) { return w.indexOf("Current version") === 0; }).length === 2);
  const origIn = global.window.codioIDE.coachBot.input;
  let objCalls = 0;
  global.window.codioIDE.coachBot.input = async function() { objCalls++; return objCalls === 1 ? { weird: true } : origIn(); };
  env.files = Object.assign({}, chatbot, { ".coach-log.json": "[]" }); env.inputs = ["q1", "bye"]; env.asks = [];
  await env.registered.fn();
  global.window.codioIDE.coachBot.input = origIn;
  check("non-string input is ignored, not a crash", env.asks.length === 1);

  console.log("Log read: empty structure is not proof the file is missing (R9)");
  const origGetS = global.window.codioIDE.files.getStructure;
  global.window.codioIDE.files.getStructure = async function() { return {}; };
  env.files = Object.assign({}, chatbot); env.inputs = ["q1", "bye"]; env.asks = [];
  await env.registered.fn();
  global.window.codioIDE.files.getStructure = origGetS;
  check("no log written when the log state is unknown", !(".coach-log.json" in env.files));

  console.log("Refresh: failed getContext() keeps the previous context (S4)");
  const gcOrig = global.window.codioIDE.coachBot.getContext;
  let gcN = 0;
  global.window.codioIDE.coachBot.getContext = async function() { gcN++; if (gcN === 2) throw new Error("context down"); return gcOrig(); };
  let e7 = await converse(chatbot, ["q1", "q2", "bye"], []);
  global.window.codioIDE.coachBot.getContext = gcOrig;
  check("messages[0] unchanged and no files-changed note", env.asks[1].messages[0].content === env.asks[0].messages[0].content && env.asks[1].messages[2].content === "q2");
  check("refreshFailed logged", e7.contextFingerprints[1].refreshFailed === true);
  gcN = 0;
  global.window.codioIDE.coachBot.getContext = async function() { gcN++; if (gcN === 1) throw new Error("context down"); return gcOrig(); };
  await converse(chatbot, ["q1", "bye"], []);
  global.window.codioIDE.coachBot.getContext = gcOrig;
  check("first-turn getContext failure still answers with the saved files", env.asks.length === 1 && env.asks[0].messages[0].content.indexOf("reply = chat(") >= 0);

  console.log("Strict mode (S1)");
  const STRICT_HEAD = "## Right now: help this student try first";
  const isStrict = function(i) { return env.asks[i].systemPrompt.indexOf(STRICT_HEAD) >= 0; };
  const prior = [];
  for (let i = 0; i < 2; i++) prior.push({ coach: "datastories", started: new Date(Date.now() - 86400000).toISOString(), exchanges: 10, questions: Array.from({ length: 10 }, function(_, k) { return "old question " + k; }) });
  let sa = await converse(Object.assign({}, chatbot, { ".coach-log.json": JSON.stringify(prior) }), ["my loop is off", "bye"], []);
  check("workspace history of 20 questions: first ask is strict", isStrict(0));
  check("session logged strict + reason workspace", sa.strict === true && sa.strictReason === "workspace");
  check("student never told about it", env.writes.every(function(w) { return !/strict|\bmode\b/i.test(w); }));

  const mk = function(extra) { return Object.assign({ coach: "datastories", started: new Date(Date.now() - 86400000).toISOString(), exchanges: 10, questions: Array.from({ length: 10 }, function(_, k) { return "old question " + k; }) }, extra); };
  const oldLog = [mk({ started: new Date(Date.now() - 30 * 86400000).toISOString() }), mk({ started: new Date(Date.now() - 30 * 86400000).toISOString() }), mk({ coach: "python" }), mk({ coach: "python" })];
  await converse(Object.assign({}, chatbot, { ".coach-log.json": JSON.stringify(oldLog) }), ["my loop is off", "bye"], []);
  check("30-day-old and other-coach sessions don't count", !isStrict(0));
  let sb = await converse(chatbot, ["a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8", "a9", "a10", "bye"], []);
  check("fresh workspace: not strict on the first asks", !isStrict(0) && !isStrict(8));
  check("strict from the 10th question (session)", isStrict(9) && sb.strict === true && sb.strictReason === "session");

  const attempt = "i think i need a loop that counts the cats";
  let sc = await converse(chatbot, ["next", "show me", "what should i write", "next step", "just tell me", attempt, attempt + " first", "next", "next", "bye"], []);
  check("5 next-step asks in a row turn it on", !isStrict(3) && isStrict(4) && sc.strictReason === "next-steps");
  check("still on after one attempt", isStrict(5));
  check("two attempts in a row turn it off", !isStrict(6) && sc.strictReleased === true);
  check("stays off after more next asks", !isStrict(7) && !isStrict(8));

  let sd = await converse(chatbot, ["q1", "q2", "q3", "bye"], [], function(n) { if (n === 1) env.files["main.py"] += "\nprint(1)\n"; });
  check("fresh sessions with ordinary questions never go strict", !isStrict(0) && !isStrict(1) && !isStrict(2) && sd.strict === false);
  // Files changed counts as an own attempt while strict is on.
  let se = await converse(chatbot, ["next", "show me", "what should i write", "next step", "just tell me", "ok trying it", "ok again", "bye"], [], function(n) {
    if (n === 5 || n === 6) env.files["main.py"] += "\nprint(" + n + ")\n";
  });
  check("changed files release strict mode too", isStrict(4) && !isStrict(6) && se.strictReleased === true);

  env.files = Object.assign({}, chatbot, { ".coach-log.json": "{not json" });
  env.inputs = ["next", "show me", "what should i write", "next step", "just tell me", "next", "bye"]; env.asks = [];
  await env.registered.fn();
  check("unreadable log: strict still works, nothing written", env.files[".coach-log.json"] === "{not json" && isStrict(4));

  console.log("Unreadable log file never gets overwritten");
  env.files = Object.assign({}, chatbot, { ".coach-log.json": "{not json" });
  env.inputs = ["q1", "bye"]; env.asks = [];
  await env.registered.fn();
  check("corrupt log left untouched", env.files[".coach-log.json"] === "{not json");
  check("coach still answered", env.asks.length === 1);

  console.log("Not shown line");
  env.files = Object.assign({}, milestone, { "big.py": "x = 1\n".repeat(40000), "late.py": "y = 2\n".repeat(3000), "later.py": "z = 3\n".repeat(3000), "latest.py": "w = 4\n".repeat(3000) });
  ctx = await t.buildContextMessage("q", false);
  check("Not shown line lists skipped files", /Not shown \(too long to include, or couldn't be read\): .*latest\.py/.test(ctx));
  check("prompt tells model about not-shown files", t.systemPrompt.indexOf("lists a file as not shown") >= 0);

  console.log(failures ? `\n${failures} FAILED` : "\nALL TESTS PASSED");
  process.exit(failures ? 1 : 0);
})();
