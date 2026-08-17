import {
  CLONE_COMMAND,
  COPY_FEEDBACK_MS,
  commandsFor,
  copyCommand,
  detectSetupOs,
  guideCommands,
  landingHourBits,
  landingHourReadout,
  landingTapeCells,
  summarizeTapeGroups,
  tapeBarHeightPct,
  tapeBarMax,
  tapeIndexFromClientX,
} from "./landing.mjs";

const ICON = {
  copy:
    '<svg class="icon" viewBox="0 0 256 256" aria-hidden="true"><path fill="currentColor" d="M216,32H88a8,8,0,0,0-8,8V80H40a8,8,0,0,0-8,8V216a8,8,0,0,0,8,8H168a8,8,0,0,0,8-8V176h40a8,8,0,0,0,8-8V40A8,8,0,0,0,216,32ZM160,208H48V96H160Zm48-48H176V88a8,8,0,0,0-8-8H96V48H208Z"/></svg>',
  check:
    '<svg class="icon" viewBox="0 0 256 256" aria-hidden="true"><path fill="currentColor" d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"/></svg>',
  warning:
    '<svg class="icon" viewBox="0 0 256 256" aria-hidden="true"><path fill="currentColor" d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm-8-80V80a8,8,0,0,1,16,0v56a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,172Z"/></svg>',
};

const cells = landingTapeCells();
let os = detectSetupOs(navigator.userAgent);
let copyTimer = 0;

function clipboardWrite() {
  return navigator.clipboard?.writeText?.bind(navigator.clipboard);
}

function setLive(host, text) {
  const live = host.querySelector(".copy-status, .status");
  if (live) {
    live.textContent = text;
    live.classList.toggle("is-fail", text === "Copy failed");
  }
}

async function copyFrom(host, text) {
  window.clearTimeout(copyTimer);
  const result = await copyCommand(clipboardWrite(), text);
  const message = result === "copied" ? "Copied" : "Copy failed";
  setLive(host, message);
  copyTimer = window.setTimeout(() => setLive(host, ""), COPY_FEEDBACK_MS);
}

function barClass(cell, selected) {
  const classes = ["tape-bar"];
  if (cell.failed) classes.push("is-fail");
  else if (cell.downloadMbps === null) classes.push("is-empty");
  if (selected) classes.push("is-selected");
  return classes.join(" ");
}

function setReadout(readout, cell) {
  readout.replaceChildren();
  for (const bit of landingHourBits(cell)) {
    const span = document.createElement("span");
    span.textContent = bit;
    readout.append(span);
  }
}

function renderTape() {
  const host = document.querySelector("[data-tape]");
  if (!(host instanceof HTMLElement)) return;

  const groups = summarizeTapeGroups(cells);
  const max = tapeBarMax(cells);
  let index = cells.length - 1;

  const readout = document.createElement("p");
  readout.className = "tape-readout";
  readout.id = "tape-readout";

  const track = document.createElement("div");
  track.className = "tape-track";
  track.role = "slider";
  track.tabIndex = 0;
  track.setAttribute("aria-labelledby", readout.id);
  track.setAttribute("aria-valuemin", "0");
  track.setAttribute("aria-valuemax", String(cells.length - 1));

  const axis = document.createElement("div");
  axis.className = "tape-axis";
  axis.innerHTML = "<span>24h ago</span><span>now</span>";

  function paint() {
    const selected = cells[index] ?? cells[cells.length - 1];
    setReadout(readout, selected);
    track.setAttribute("aria-valuenow", String(index));
    track.setAttribute("aria-valuetext", landingHourReadout(selected));
    track.replaceChildren();

    groups.forEach((group, groupIndex) => {
      const col = document.createElement("div");
      col.className = "tape-group";
      col.style.flexGrow = String(group.count);
      col.style.flexBasis = "0";
      if (groupIndex === 0) col.style.paddingLeft = "0";

      const label = document.createElement("p");
      label.textContent = group.part;
      const bars = document.createElement("div");
      bars.className = "tape-bars";

      group.cells.forEach((cell, cellIndex) => {
        const absolute = group.startIndex + cellIndex;
        const bar = document.createElement("div");
        bar.className = barClass(cell, absolute === index);
        bar.style.height = `${tapeBarHeightPct(cell, max)}%`;
        bar.style.animationDelay = `${absolute * 18}ms`;
        bars.append(bar);
      });

      col.append(label, bars);
      track.append(col);
    });
  }

  function setFromClientX(clientX) {
    const rect = track.getBoundingClientRect();
    const next = tapeIndexFromClientX(
      clientX,
      rect.left,
      rect.width,
      cells.length,
    );
    if (next === index) return;
    index = next;
    paint();
  }

  track.addEventListener("pointermove", (event) => setFromClientX(event.clientX));
  track.addEventListener("pointerdown", (event) => setFromClientX(event.clientX));
  track.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      index = Math.min(cells.length - 1, index + 1);
      paint();
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      index = Math.max(0, index - 1);
      paint();
    }
    if (event.key === "Home") {
      event.preventDefault();
      index = 0;
      paint();
    }
    if (event.key === "End") {
      event.preventDefault();
      index = cells.length - 1;
      paint();
    }
  });

  host.replaceChildren(readout, track, axis);
  paint();
}

function statusIcon(result) {
  if (result === "copied") return ICON.check;
  if (result === "failed") return ICON.warning;
  return ICON.copy;
}

function renderCommandList(list, items) {
  list.replaceChildren();
  for (const item of items) {
    const li = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.innerHTML = `<span class="row"><span class="name">${ICON.copy}${item.name}</span><span class="status sr-only" aria-live="polite"></span><span class="sr-only">Copy command</span></span><code>${item.command}</code>${
      item.note ? `<span class="note">${item.note}</span>` : ""
    }`;
    button.addEventListener("click", async () => {
      const name = button.querySelector(".name");
      const status = button.querySelector(".status");
      const result = await copyCommand(clipboardWrite(), item.command);
      if (name) {
        name.innerHTML = `${statusIcon(result)}${item.name}`;
      }
      if (status instanceof HTMLElement) {
        status.textContent = result === "copied" ? "Copied" : "Copy failed";
        status.classList.toggle("sr-only", false);
        status.classList.toggle("is-fail", result === "failed");
        window.clearTimeout(copyTimer);
        copyTimer = window.setTimeout(() => {
          status.textContent = "";
          status.classList.add("sr-only");
          status.classList.remove("is-fail");
          name.innerHTML = `${ICON.copy}${item.name}`;
        }, COPY_FEEDBACK_MS);
      }
    });
    li.append(button);
    list.append(li);
  }
}

function renderCommands() {
  const lists = document.querySelectorAll("[data-commands]");
  for (const list of lists) {
    if (!(list instanceof HTMLElement)) continue;
    const pinned = list.dataset.commands;
    const items =
      pinned === "mac" || pinned === "windows" || pinned === "agents"
        ? guideCommands(pinned)
        : commandsFor(os);
    renderCommandList(list, items);
  }

  const note = document.querySelector("[data-windows-note]");
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
  const button = document.querySelector('[data-copy="clone"]');
  if (!(button instanceof HTMLButtonElement)) return;
  button.addEventListener("click", () => copyFrom(button, CLONE_COMMAND));
}

export function initLandingPage() {
  renderTape();
  renderCommands();
  bindOsTabs();
  bindClone();
}

initLandingPage();
