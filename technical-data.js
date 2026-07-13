function fallbackCopy(value) {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "readonly");
  textarea.className = "copy-buffer";
  document.body.append(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function announceCopy(message) {
  const announcer = document.querySelector("[data-copy-announcer]");
  if (announcer) announcer.textContent = message;
}

function copyValue(value, button) {
  const message = button.dataset.copyLabel || "Full value copied";
  const previous = button.textContent;
  const done = () => {
    button.textContent = message;
    announceCopy(message);
    window.setTimeout(() => {
      button.textContent = previous;
    }, 1600);
  };

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(value).then(done).catch(() => {
      fallbackCopy(value);
      done();
    });
    return;
  }

  fallbackCopy(value);
  done();
}

function bindCopyControls() {
  document.querySelectorAll("[data-copy]").forEach((button) => {
    if (button.dataset.copyBound === "true") return;
    button.dataset.copyBound = "true";
    button.addEventListener("click", () => copyValue(button.dataset.copy || "", button));
  });
}

function bindWrapControls() {
  document.querySelectorAll("[data-wrap-toggle]").forEach((button) => {
    if (button.dataset.wrapBound === "true") return;
    button.dataset.wrapBound = "true";
    const panel = button.closest("[data-code-panel]");
    const code = panel?.querySelector("[data-code-value]");
    if (!panel || !code) return;

    button.addEventListener("click", () => {
      const wrapped = panel.dataset.wrap === "true";
      panel.dataset.wrap = String(!wrapped);
      button.setAttribute("aria-pressed", String(!wrapped));
      button.textContent = wrapped ? "Wrap lines" : "Scroll lines";
    });
  });
}

function bindFilterDisclosure() {
  const disclosure = document.querySelector("[data-filter-disclosure]");
  if (!disclosure) return;
  const sync = () => {
    if (window.matchMedia("(min-width: 701px)").matches) {
      disclosure.open = true;
    }
  };
  sync();
  window.addEventListener("resize", sync);
}

function relativeTimeLabel(seconds) {
  if (seconds < 5) return "Updated just now";
  if (seconds < 60) return `Updated ${seconds} seconds ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `Updated ${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 48) {
    return `Updated ${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.floor(hours / 24);
  return `Updated ${days} day${days === 1 ? "" : "s"} ago`;
}

function bindRelativeTimes() {
  if (document.documentElement.dataset.relativeTimesBound === "true") return;
  if (!document.querySelector("[data-relative-time]")) return;

  document.documentElement.dataset.relativeTimesBound = "true";

  const update = () => {
    document.querySelectorAll("[data-relative-time]").forEach((node) => {
      const timestamp = Date.parse(node.dataset.relativeTime || "");
      if (!Number.isFinite(timestamp)) return;

      const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
      node.textContent = relativeTimeLabel(seconds);
    });
  };

  update();
  window.setInterval(update, 30_000);
}

bindCopyControls();
bindWrapControls();
bindFilterDisclosure();
bindRelativeTimes();
