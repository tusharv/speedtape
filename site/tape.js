import {
  CLONE_COMMAND,
  COPY_FEEDBACK_MS,
  barHeightPercent,
  commandsFor,
  copyCommand,
  detectSetupOs,
  landingHourReadout,
  landingTapeCells,
} from "./landing.mjs";

const cells = landingTapeCells();
let os = detectSetupOs(navigator.userAgent);
let copyTimer = 0;

function clipboardWrite() {
  return navigator.clipboard?.writeText?.bind(navigator.clipboard);
}

function setLive(host, text) {
  const live = host.querySelector(".sr-live, .status");
  if (live) live.textContent = text;
}

async function copyFrom(host, text) {
  window.clearTimeout(copyTimer);
  const result = await copyCommand(clipboardWrite(), text);
  const message = result === "copied" ? "Copied" : "Couldn't copy";
  setLive(host, message);
  copyTimer = window.setTimeout(() => setLive(host, ""), COPY_FEEDBACK_MS);
}

function renderTape() {
  const tape = document.querySelector("[data-tape]");
  const readout = document.querySelector("[data-tape-readout]");
  if (!(tape instanceof HTMLElement) || !(readout instanceof HTMLElement)) {
    return;
  }

  tape.replaceChildren();
  cells.forEach((cell, index) => {
    const bar = document.createElement("button");
    bar.type = "button";
    bar.style.setProperty("--h", `${barHeightPercent(cell)}%`);
    bar.style.animationDelay = `${index * 18}ms`;
    bar.className = cell.failed ? "is-fail" : "";
    bar.setAttribute("aria-label", landingHourReadout(cell));
    const show = () => {
      readout.textContent = landingHourReadout(cell);
    };
    bar.addEventListener("mouseenter", show);
    bar.addEventListener("focus", show);
    tape.append(bar);
  });
}

function renderCommands() {
  const list = document.querySelector("[data-commands]");
  const note = document.querySelector("[data-windows-note]");
  if (!(list instanceof HTMLElement)) return;

  const items = commandsFor(os);
  list.replaceChildren();
  for (const item of items) {
    const li = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.innerHTML = `<span class="name">${item.name}</span><code>${item.command}</code><span class="status" aria-live="polite"></span>${
      item.note ? `<span class="note">${item.note}</span>` : ""
    }`;
    button.addEventListener("click", () => copyFrom(button, item.command));
    li.append(button);
    list.append(li);
  }

  if (note instanceof HTMLElement) {
    note.hidden = os !== "windows";
  }

  for (const tab of document.querySelectorAll("[data-os]")) {
    if (!(tab instanceof HTMLButtonElement)) continue;
    tab.setAttribute("aria-selected", tab.dataset.os === os ? "true" : "false");
  }
}

function bindOsTabs() {
  for (const tab of document.querySelectorAll("[data-os]")) {
    if (!(tab instanceof HTMLButtonElement)) continue;
    tab.addEventListener("click", () => {
      os = tab.dataset.os === "windows" ? "windows" : "mac";
      renderCommands();
    });
  }
}

function bindClone() {
  const button = document.querySelector("[data-copy=clone]");
  if (!(button instanceof HTMLButtonElement)) return;
  button.addEventListener("click", () => copyFrom(button, CLONE_COMMAND));
}

renderTape();
renderCommands();
bindOsTabs();
bindClone();
