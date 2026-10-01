const commandGrid = document.querySelector(".bash-theme .cli-grid");

function updateCommandConnectors() {
  if (!commandGrid || window.innerWidth <= 760) {
    return;
  }

  const gridBounds = commandGrid.getBoundingClientRect();
  const lineCenter = gridBounds.left + gridBounds.width / 2 + 1.5;
  const leftConnectorExtension = 4;
  const commandCards = commandGrid.querySelectorAll("article");

  commandCards.forEach((card, index) => {
    const cardBounds = card.getBoundingClientRect();
    const isLeftCard = index % 2 === 0;
    const connectorLength = isLeftCard
      ? lineCenter - cardBounds.right
      : cardBounds.left - lineCenter;
    const adjustedLength = isLeftCard
      ? connectorLength + leftConnectorExtension
      : connectorLength;

    card.style.setProperty(
      "--connector-length",
      `${Math.max(0, adjustedLength)}px`,
    );
  });
}

const connectorObserver = new ResizeObserver(updateCommandConnectors);

if (commandGrid) {
  connectorObserver.observe(commandGrid);
}

window.addEventListener("resize", updateCommandConnectors);
window.addEventListener("load", updateCommandConnectors);

updateCommandConnectors();

const terminalOutput = document.querySelector("#terminal-output");
const terminalForm = document.querySelector("#terminal-form");
const terminalInput = document.querySelector("#terminal-input");
const terminalPrompt = document.querySelector("#terminal-prompt");

const virtualDirectories = new Set([
  "/",
  "/home",
  "/home/student",
  "/home/student/projects",
  "/home/student/documents",
]);

const virtualFiles = new Set([
  "/home/student/notes.txt",
  "/home/student/todo.md",
  "/home/student/projects/app.sh",
  "/home/student/projects/data.txt",
  "/home/student/documents/readme.md",
]);

let currentDirectory = "/home/student";
const commandHistory = [];

function getParentPath(path) {
  if (path === "/") {
    return "/";
  }

  const parent = path.slice(0, path.lastIndexOf("/"));
  return parent || "/";
}

function getFileName(path) {
  return path.slice(path.lastIndexOf("/") + 1);
}

function resolvePath(input = "") {
  const pathParts = input.startsWith("/") ? [] : currentDirectory.split("/").filter(Boolean);

  input.split("/").forEach((part) => {
    if (!part || part === ".") {
      return;
    }

    if (part === "..") {
      pathParts.pop();
      return;
    }

    pathParts.push(part);
  });

  return `/${pathParts.join("/")}`.replace(/\/$/, "") || "/";
}

function readablePath(path) {
  return path === "/home/student" ? "~" : path.replace("/home/student", "~");
}

function updatePrompt() {
  terminalPrompt.textContent = `student@linux:${readablePath(currentDirectory)}$`;
}

function printTerminalLine(text, className = "") {
  const line = document.createElement("p");
  line.textContent = text;

  if (className) {
    line.className = className;
  }

  terminalOutput.append(line);
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function listDirectory(path) {
  const entries = [];

  virtualDirectories.forEach((directory) => {
    if (directory !== path && getParentPath(directory) === path) {
      entries.push(`${getFileName(directory)}/`);
    }
  });

  virtualFiles.forEach((file) => {
    if (getParentPath(file) === path) {
      entries.push(getFileName(file));
    }
  });

  return entries.sort((first, second) => first.localeCompare(second, "uk"));
}

function splitCommand(command) {
  return command.match(/(?:[^\s"]+|"[^"]*")+/g)?.map((part) => part.replaceAll('"', "")) || [];
}

function runTerminalCommand(command) {
  const [name, ...argumentsList] = splitCommand(command);

  if (!name) {
    return;
  }

  if (name === "help") {
    printTerminalLine("Доступні команди: pwd, ls, cd, echo, touch, mkdir, cp, mv, rm, history, clear");
    return;
  }

  if (name === "pwd") {
    printTerminalLine(currentDirectory);
    return;
  }

  if (name === "ls") {
    const target = resolvePath(argumentsList[0] || "");

    if (!virtualDirectories.has(target)) {
      printTerminalLine(`ls: не вдалося відкрити '${argumentsList[0]}': немає такої папки`, "terminal-error");
      return;
    }

    printTerminalLine(listDirectory(target).join("  ") || "(порожня папка)");
    return;
  }

  if (name === "cd") {
    const target = resolvePath(argumentsList[0] || "/home/student");

    if (!virtualDirectories.has(target)) {
      printTerminalLine(`cd: ${argumentsList[0]}: немає такої папки`, "terminal-error");
      return;
    }

    currentDirectory = target;
    updatePrompt();
    return;
  }

  if (name === "echo") {
    printTerminalLine(argumentsList.join(" "));
    return;
  }

  if (name === "touch" || name === "mkdir") {
    const target = resolvePath(argumentsList[0]);

    if (!argumentsList[0]) {
      printTerminalLine(`${name}: вкажіть назву`, "terminal-error");
      return;
    }

    if (!virtualDirectories.has(getParentPath(target))) {
      printTerminalLine(`${name}: батьківська папка не існує`, "terminal-error");
      return;
    }

    if (name === "touch") {
      virtualFiles.add(target);
    } else {
      virtualDirectories.add(target);
    }

    return;
  }

  if (name === "cp" || name === "mv") {
    const source = resolvePath(argumentsList[0]);
    let destination = resolvePath(argumentsList[1]);

    if (!argumentsList[0] || !argumentsList[1] || !virtualFiles.has(source)) {
      printTerminalLine(`${name}: можна працювати лише з наявними віртуальними файлами`, "terminal-error");
      return;
    }

    if (virtualDirectories.has(destination)) {
      destination = `${destination}/${getFileName(source)}`;
    }

    if (!virtualDirectories.has(getParentPath(destination))) {
      printTerminalLine(`${name}: папка призначення не існує`, "terminal-error");
      return;
    }

    virtualFiles.add(destination);

    if (name === "mv") {
      virtualFiles.delete(source);
    }

    return;
  }

  if (name === "rm") {
    const target = resolvePath(argumentsList[0]);

    if (!virtualFiles.delete(target)) {
      printTerminalLine(`rm: ${argumentsList[0]}: немає такого файлу`, "terminal-error");
    }

    return;
  }

  if (name === "history") {
    commandHistory.forEach((historyCommand, index) => {
      printTerminalLine(`${index + 1}  ${historyCommand}`);
    });
    return;
  }

  if (name === "clear") {
    terminalOutput.replaceChildren();
    return;
  }

  printTerminalLine(`${name}: команду не знайдено. Введіть help.`, "terminal-error");
}

if (terminalForm && terminalInput && terminalOutput && terminalPrompt) {
  printTerminalLine("Віртуальний Bash-термінал. Введіть help, щоб побачити доступні команди.");
  updatePrompt();

  terminalForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const command = terminalInput.value.trim();

    if (!command) {
      return;
    }

    printTerminalLine(`${terminalPrompt.textContent} ${command}`, "terminal-command");
    commandHistory.push(command);
    runTerminalCommand(command);
    terminalInput.value = "";
  });
}
