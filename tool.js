const el = (id) => document.getElementById(id);

const state = {
  msgType: el("msgType"),
  scenario: el("scenario"),
  audience: el("audience"),
  tone: el("tone"),
  name: el("name"),
  yourName: el("yourName"),
  ticket: el("ticket"),
  eta: el("eta"),
  issue: el("issue"),
  tried: el("tried"),
  error: el("error"),
  next: el("next"),
  draftOut: el("draftOut"),
  promptOut: el("promptOut"),
  status: el("status"),
  generateBtn: el("generateBtn"),
  copyDraftBtn: el("copyDraftBtn"),
  copyPromptBtn: el("copyPromptBtn"),
  clearBtn: el("clearBtn")
};

function clean(s) {
  return (s || "").toString().trim();
}

function greeting(name, tone) {
  const n = clean(name);
  if (!n) return "Hello,";
  if (tone === "friendly") return `Hi ${n},`;
  return `Hello ${n},`;
}

function signoff(tone, yourName) {
  const y = clean(yourName) || "IT Support";
  if (tone === "friendly") return `Thank you,\n${y}`;
  if (tone === "firm") return `Regards,\n${y}`;
  return `Best regards,\n${y}`;
}

function scenarioLabel(key) {
  const map = {
    password_reset: "Password reset",
    account_locked: "Account locked",
    mfa_issue: "MFA issue",
    vpn_issue: "VPN or remote access",
    email_issue: "Email issue",
    printer_issue: "Printer issue",
    software_install: "Software install request",
    access_request: "Access request",
    outage_update: "Outage update",
    follow_up: "Follow up"
  };
  return map[key] || "IT update";
}

function makeSubject({ scenario, ticket, msgType }) {
  const base = scenarioLabel(scenario);
  const t = clean(ticket);
  if (msgType !== "email") return "";
  if (t) return `${base} | ${t}`;
  return base;
}

function toneStyle(tone) {
  if (tone === "friendly") {
    return {
      intro: "I hope you are doing well.",
      ask: "When you have a moment, please",
      close: "If you run into any issues, I can help."
    };
  }
  if (tone === "firm") {
    return {
      intro: "I am following up on this issue.",
      ask: "Please",
      close: "Reply with the requested information so we can proceed."
    };
  }
  return {
    intro: "I am reaching out regarding the issue below.",
    ask: "Please",
    close: "If you have questions, reply and I will help."
  };
}

function buildDraft(input) {
  const {
    msgType,
    scenario,
    audience,
    tone,
    name,
    yourName,
    ticket,
    eta,
    issue,
    tried,
    error,
    next
  } = input;

  const t = toneStyle(tone);
  const g = greeting(name, tone);
  const s = signoff(tone, yourName);

  const lines = [];

  if (msgType === "email") {
    const subject = makeSubject({ scenario, ticket, msgType });
    if (subject) lines.push(`Subject: ${subject}\n`);
  }

  lines.push(g);

  if (scenario === "outage_update") {
    lines.push("");
    lines.push(t.intro);
    if (clean(ticket)) lines.push(`Reference: ${clean(ticket)}`);
    if (clean(issue)) lines.push(`Summary: ${clean(issue)}`);
    if (clean(eta)) lines.push(`ETA: ${clean(eta)}`);
    lines.push("");
    lines.push(`${t.ask} avoid repeated retries. I will share an update once we confirm stability.`);
    lines.push("");
    lines.push(s);
    return lines.join("\n");
  }

  if (scenario === "access_request") {
    lines.push("");
    lines.push(t.intro);
    if (clean(ticket)) lines.push(`Reference: ${clean(ticket)}`);
    if (clean(issue)) lines.push(`Request: ${clean(issue)}`);
    if (clean(next)) lines.push(`Next step: ${clean(next)}`);
    lines.push("");
    lines.push(`${t.ask} confirm the access level and the system name, then I can proceed.`);
    lines.push("");
    lines.push(s);
    return lines.join("\n");
  }

  lines.push("");
  lines.push(t.intro);

  if (clean(ticket)) lines.push(`Ticket: ${clean(ticket)}`);
  if (clean(issue)) lines.push(`Issue: ${clean(issue)}`);

  if (clean(error)) lines.push(`Error: ${clean(error)}`);

  if (clean(tried)) {
    lines.push("");
    lines.push("What was tried:");
    lines.push(clean(tried));
  }

  if (clean(next)) {
    lines.push("");
    lines.push("Next step:");
    lines.push(clean(next));
  } else {
    lines.push("");
    lines.push(`${t.ask} reply with the best time to troubleshoot, or confirm if the issue still happens.`);
  }

  if (clean(eta)) {
    lines.push("");
    lines.push(`Timeframe: ${clean(eta)}`);
  }

  if (audience === "manager") {
    lines.push("");
    lines.push("Impact: User productivity affected until access is restored.");
  }

  lines.push("");
  lines.push(t.close);
  lines.push("");
  lines.push(s);

  return lines.join("\n");
}

function buildPrompt(input) {
  const subject = makeSubject({
    scenario: input.scenario,
    ticket: input.ticket,
    msgType: input.msgType
  });

  const parts = [];
  parts.push("You are an IT support professional. Rewrite the message below to be clear, concise, and helpful.");
  parts.push("Keep it professional and easy to understand.");
  parts.push("Avoid sensitive data. Do not include passwords.");
  parts.push("");

  parts.push("Requirements:");
  parts.push(`Tone: ${input.tone}`);
  parts.push(`Message type: ${input.msgType}`);
  parts.push(`Audience: ${input.audience}`);
  if (subject) parts.push(`Subject: ${subject}`);
  parts.push("");

  parts.push("Draft inputs:");
  if (clean(input.ticket)) parts.push(`Ticket: ${clean(input.ticket)}`);
  parts.push(`Scenario: ${scenarioLabel(input.scenario)}`);
  if (clean(input.issue)) parts.push(`Issue: ${clean(input.issue)}`);
  if (clean(input.error)) parts.push(`Error: ${clean(input.error)}`);
  if (clean(input.tried)) parts.push(`Tried: ${clean(input.tried)}`);
  if (clean(input.next)) parts.push(`Next: ${clean(input.next)}`);
  if (clean(input.eta)) parts.push(`Timeframe: ${clean(input.eta)}`);

  parts.push("");
  parts.push("Output format:");
  parts.push("If email, provide a subject line and the email body.");
  parts.push("If chat, provide a short message and a longer version.");
  parts.push("If ticket, provide an internal update that includes steps taken and next action.");

  return parts.join("\n");
}

async function copyText(text) {
  const t = clean(text);
  if (!t) return false;
  await navigator.clipboard.writeText(t);
  return true;
}

function setStatus(msg) {
  state.status.textContent = msg;
}

function readInput() {
  return {
    msgType: state.msgType.value,
    scenario: state.scenario.value,
    audience: state.audience.value,
    tone: state.tone.value,
    name: clean(state.name.value),
    yourName: clean(state.yourName.value),
    ticket: clean(state.ticket.value),
    eta: clean(state.eta.value),
    issue: clean(state.issue.value),
    tried: clean(state.tried.value),
    error: clean(state.error.value),
    next: clean(state.next.value)
  };
}

function generate() {
  const input = readInput();
  const draft = buildDraft(input);
  const prompt = buildPrompt(input);
  state.draftOut.value = draft;
  state.promptOut.value = prompt;

  localStorage.setItem("msgWriter_last", JSON.stringify({ input, draft, prompt }));
  setStatus("Generated. You can copy the draft or the AI prompt.");
}

function clearAll() {
  [
    "name",
    "ticket",
    "eta",
    "issue",
    "tried",
    "error",
    "next",
    "draftOut",
    "promptOut"
  ].forEach((k) => (state[k].value = ""));
  setStatus("Cleared.");
}

function restore() {
  const raw = localStorage.getItem("msgWriter_last");
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    if (!data?.input) return;

    state.msgType.value = data.input.msgType || "email";
    state.scenario.value = data.input.scenario || "password_reset";
    state.audience.value = data.input.audience || "customer";
    state.tone.value = data.input.tone || "professional";

    state.name.value = data.input.name || "";
    state.yourName.value = data.input.yourName || "J Roque";
    state.ticket.value = data.input.ticket || "";
    state.eta.value = data.input.eta || "";
    state.issue.value = data.input.issue || "";
    state.tried.value = data.input.tried || "";
    state.error.value = data.input.error || "";
    state.next.value = data.input.next || "";

    state.draftOut.value = data.draft || "";
    state.promptOut.value = data.prompt || "";
    setStatus("Restored your last draft from this browser.");
  } catch {
    // ignore
  }
}

state.generateBtn.addEventListener("click", generate);

state.copyDraftBtn.addEventListener("click", async () => {
  const ok = await copyText(state.draftOut.value);
  setStatus(ok ? "Draft copied." : "Nothing to copy.");
});

state.copyPromptBtn.addEventListener("click", async () => {
  const ok = await copyText(state.promptOut.value);
  setStatus(ok ? "AI prompt copied." : "Nothing to copy.");
});

state.clearBtn.addEventListener("click", clearAll);

restore();
