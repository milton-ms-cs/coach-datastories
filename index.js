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
  const DEBUG_MODE = false;  // Set to true to see debug output

  // Try to read actual notebook and data files from workspace
  async function tryGetWorkspaceFiles() {
    let filesContext = "";
    const totalBudget = 40000;

    try {
      if (!codioIDE.workspace || !codioIDE.workspace.getFileTree) {
        return filesContext;
      }

      const fileTree = await codioIDE.workspace.getFileTree();
      const relevantFiles = findRelevantFiles(fileTree);

      for (const filePath of relevantFiles) {
        if (filesContext.length >= totalBudget) {
          break;
        }

        try {
          const content = await codioIDE.workspace.readFile(filePath);
          const maxLength = Math.min(15000, totalBudget - filesContext.length);

          if (content && content.length > 0) {
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
    } catch (error) {
      // Silent
    }

    return filesContext;
  }

  // Find relevant files (notebooks, python files, CSVs)
  function findRelevantFiles(fileTree, path = '') {
    let files = [];

    if (fileTree.children) {
      for (const item of fileTree.children) {
        const fullPath = path ? `${path}/${item.name}` : item.name;

        if (item.type === 'file') {
          const lower = item.name.toLowerCase();
          if (!item.name.startsWith('.') &&
              (lower.endsWith('.ipynb') || lower.endsWith('.py') || lower.endsWith('.csv'))) {
            files.push(fullPath);
          }
        } else if (item.type === 'directory' && !item.name.startsWith('.')) {
          files = files.concat(findRelevantFiles(item, fullPath));
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

  async function onButtonPress() {
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
    try {
      initialInput = await codioIDE.coachBot.input("What can I help you with?");
    } catch (e) {
      codioIDE.coachBot.showMenu();
      return;
    }

    // Build notebook context from open Jupyter notebooks
    const notebookContent = extractNotebookContent(context.jupyterContext);

    // Try to get additional workspace files
    const workspaceFiles = await tryGetWorkspaceFiles();

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

    const initialUserPrompt = `Here is the student's open notebook and workspace files:
<notebook>
${filesContent}
</notebook>
Here is the assignment guide:
<guide>
${guideContent}
</guide>
${assignmentName ? `\nAssignment: ${assignmentName}\n` : ''}
The student says: ${initialInput}`;

    messages.push({
      "role": "user",
      "content": initialUserPrompt
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

      const trimmedInput = input.trim().toLowerCase();
      if (exitPhrases.includes(trimmedInput)) {
        break;
      }

      messages.push({
        "role": "user",
        "content": input
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
        continue;
      } finally {
        codioIDE.coachBot.hideThinkingAnimation();
      }

      // Keep first message (with notebook + guide) + last 8 messages (4 exchanges)
      while (messages.length > 9) {
        messages.splice(1, 2); // drop the oldest assistant+user pair, keep messages[0] (context) intact
      }
    }

    codioIDE.coachBot.write("You're welcome! Please feel free to ask any more questions about this course!");
    codioIDE.coachBot.showMenu();
  }
})(window.codioIDE, window);
