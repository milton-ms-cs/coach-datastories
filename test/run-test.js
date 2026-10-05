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
function check(label, cond) {
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
  hangWrites: false
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
        if (env.hangWrites) return new Promise(function() {});
        if (p in env.files) throw new Error("exists");
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
  check("main.py comes before data files", ctx.indexOf("File: main.py") < ctx.indexOf("goodreads.csv (PREVIEW"));
  check("guide included", ctx.indexOf("<guide>\nPrint the column names") >= 0);
  check("context stays under budget", ctx.length < 45000);

  console.log("Empty starter file");
  env.files = Object.assign({}, milestone, { "main.py": "" });
  ctx = await t.buildContextMessage("where do I start?");
  check("empty main.py shown as not started", ctx.indexOf("File: main.py\n(empty — nothing written yet)") >= 0);
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
   "Interpreting data is theirs"].forEach(function(s) { check("prompt mentions: " + s, sp.indexOf(s) >= 0); });
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
  env.files = Object.assign({}, chatbot);
  env.inputs = ["q1", "q2", "thanks"];
  env.asks = [];
  env.hangWrites = true;
  let finished = false;
  env.registered.fn().then(function() { finished = true; });
  await new Promise(function(r) { setTimeout(r, 300); });
  check("both turns ran despite a hanging log write", env.asks.length === 2);
  env.hangWrites = false;

  console.log(failures ? `\n${failures} FAILED` : "\nALL TESTS PASSED");
  process.exit(failures ? 1 : 0);
})();
