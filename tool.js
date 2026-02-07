const $ = (id) => document.getElementById(id);

const ui = {
  msgType: $("msgType"),
  scenario: $("scenario"),
  audience: $("audience"),
  tone: $("tone"),
  recipient: $("recipient"),
  yourName: $("yourName"),
  ticket: $("ticket"),
  eta: $("eta"),
  issue: $("issue"),
  tried: $("tried"),
  error: $("error"),
  next: $("next"),
  draftOut: $("draftOut"),
  promptOut: $("promptOut"),
  status: $("status"),
  generateBtn: $("generateBtn"),
  copyDraftBtn: $("copyDraftBtn"),
  copyPromptBtn: $("copyPromptBtn"),
  clearBtn: $("clearBtn")
};

function clean(v) {
  return (v ?? "").toString().trim();
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
  return map[key] || "IT support update";
}

function makeSubject({ scenario, ticket }) {
  const base = scenarioLabel(scenario);
  const t = clean(ticket);
  return t ? `${base} | ${t}` : base;
}

function greeting(recipient, tone) {
  const name = clean(recipient);
  if (!name) return "Hello,";
  if (tone === "friendly") return `Hi ${name},`;
  return `Hello ${name},`;
}

function signoff(tone, yourName) {
  const me = clean(yourName) || "IT Support";
  if (tone === "friendly") return `Thank you,\n${me}`;
  if (tone === "firm") return `Regards,\n${me}`;
  return `Best regards,\n${me}`;
}

function tonePhrases(tone) {
  if (tone === "friendly") {
    return {
      intro: "I hope you are doing well.",
      ask: "When you have a moment, please",
      close: "If anything still looks off, reply and I can help."
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

function readInput() {
  return {
    msgType: ui.msgType.value,
    scenario: ui.scenario.value,
    audience: ui.audience.value,
    tone: ui.tone.value,
    recipient: clean(ui.recipient.value),
    yourName: clean(ui.yourName.value),
    ticket: clean(ui.ticket.value),
    eta: clean(ui.eta.value),
    issue: clean(ui.issue.value),
    tried: clean(ui.tried.value),
    error: clean(ui.error.value),
    next: clean(ui.next.value)
  };
}

function buildEmail(input) {
  const t = tonePhrases(input.tone);
  const g = greeting(input.recipient, input.tone);
  const s = signoff(input.tone, input.yourName);

  const lines = [];
  lines.push(`Subject: ${makeSubject({ scenario: input.scenario, ticket: input.ticket })}`);
  lines.push("");
  lines.push(g);
  lines.push("");
  lines.push(t.intro);

  if (input.ticket) lines.push(`Ticket: ${input.ticket}`);
  if (input.issue) lines.push(`Issue: ${input.issue}`);
  if (input.error) lines.push(`Error: ${input.error}`);

  if (input.tried) {
    lines.push("");
    lines.push("What was tried:");
    lines.push(input.tried);
  }

  lines.push("");
  if (input.next) {
    lines.push("Next step:");
    lines.push(input.next);
  } else {
    lines.push(`${t.ask} confirm whether the issue still happens and what time works to troubleshoot.`);
  }

  if (input.eta) {
    lines.push("");
    lines.push(`Timeframe: ${input.eta}`);
  }

  if (input.audience === "manager") {
    lines.push("");
    lines.push("Impact: User productivity is affected until service is restored.");
  }

  lines.push("");
  lines.push(t.close);
  lines.push("");
  lines.push(s);

  return lines.join("\n");
}

function buildChat(input) {
  const t = tonePhrases(input.tone);
  const name = clean(input.recipient);
  const who = name ? `${name}` : "there";

  const short = [];
  short.push(`Hi ${who}. ${scenarioLabel(input.scenario)} update.`);
  if (input.ticket) short.push(`Ticket: ${input.ticket}.`);
  if (input.issue) short.push(`Issue: ${input.issue}`);
  if (input.next) short.push(`Next: ${input.next}`);
  if (input.eta) short.push(`ETA: ${input.eta}.`);
  const shortMsg = short.join(" ");

  const long = [];
  long.push(greeting(input.recipient, input.tone));
  long.push("");
  long.push(t.intro);
  if (input.ticket) long.push(`Ticket: ${input.ticket}`);
  if (input.issue) long.push(`Issue: ${input.issue}`);
  if (input.error) long.push(`Error: ${input.error}`);
  if (input.tried) {
    long.push("");
    long.push("What was tried:");
    long.push(input.tried);
  }
  long.push("");
  long.push(input.next ? `Next step: ${input.next}` : `${t.ask} share any additional details and I will continue troubleshooting.`);
  if (input.eta) {
    long.push("");
    long.push(`Timeframe: ${input.eta}`);
  }
  long.push("");
  long.push(signoff(input.tone, input.yourName));

  return `Short version:\n${shortMsg}\n\nLong version:\n${long.join("\n")}`;
}

function buildTicket(input) {
  const lines = [];
  lines.push(`[${scenarioLabel(input.scenario)}] Internal update`);
  if (input.ticket) lines.push(`Ticket: ${input.ticket}`);
  lines.push("");

  if (input.issue) lines.push(`Summary: ${input.issue}`);
  if (input.error) lines.push(`Error observed: ${input.error}`);

  if (input.tried) {
    lines.push("");
    lines.push("Actions taken:");
    lines.push(input.tried);
  }

  lines.push("");
  lines.push("Next action:");
  if (input.next) {
    lines.push(input.next);
  } else {
    lines.push("Awaiting user confirmation and additional details to continue troubleshooting.");
  }

  if (input.eta) {
    lines.push("");
    lines.push(`ETA or target: ${input.eta}`);
  }

  lines.push("");
  lines.push("Note: Do not store passwords or sensitive personal data in ticket notes.");

  return lines.join("\n");
}

function buildDraft(input) {
  if (input.scenario === "outage_update") {
    if (input.msgType === "ticket") {
      const base = buildTicket(input);
      return `${base}\n\nOutage note:\nMonitoring service stability and providing periodic updates.`;
    }
    if (input.msgType === "chat") {
      const msg = `Short version:\nService update: We are investigating an outage. ${input.eta ? `ETA: ${input.eta}.` : "ETA: Pending."}\n\nLong version:\n${buildEmail(input)}`;
      return msg;
    }
    return buildEmail(input);
  }

  if (input.msgType === "chat") return buildChat(input);
  if (input.msgType === "ticket") return buildTicket(input);
  return buildEmail(input);
}

function buildPrompt(input) {
  const parts = [];
  parts.push("You are an IT support professional.");
  parts.push("Rewrite the message to be clear, concise, and helpful.");
  parts.push("Do not include passwords or sensitive personal data.");
  parts.push("");
  parts.push("Requirements:");
  parts.push(`Message type: ${input.msgType}`);
  parts.push(`Tone: ${input.tone}`);
  parts.push(`Audience: ${input.audience}`);
  parts.push(`Scenario: ${scenarioLabel(input.scenario)}`);
  if (input.ticket) parts.push(`Ticket: ${input.ticket}`);
  if (input.eta) parts.push(`Timeframe: ${input.eta}`);
  parts.push("");
  parts.push("Inputs:");
  if (input.issue) parts.push(`Issue: ${input.issue}`);
  if (input.error) parts.push(`Error: ${input.error}`);
  if (input.tried) parts.push(`Tried: ${input.tried}`);
  if (input.next) parts.push(`Next: ${input.next}`);
  parts.push("");
  parts.push("Output format:");
  parts.push("If email, provide a subject line and a clean email body.");
  parts.push("If chat, provide a short and long version.");
  parts.push("If ticket, provide an internal update with actions taken and next action.");
  return parts.join("\n");
}

function setStatus(msg) {
  ui.status.textContent = msg;
}

async function copyToClipboard(text) {
  const t = clean(text);
  if (!t) return false;
  await navigator.clipboard.writeText(t);
  return true;
}

function save(input) {
  const data = {
    input,
    draft: ui.draftOut.value,
    prompt: ui.promptOut.value
  };
  localStorage.setItem("it_message_writer_last", JSON.stringify(data));
}

function restore() {
  const raw = localStorage.getItem("it_message_writer_last");
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    if (!data?.input) return;

    ui.msgType.value = data.input.msgType || "email";
    ui.scenario.value = data.input.scenario || "password_reset";
    ui.audience.value = data.input.audience || "customer";
    ui.tone.value = data.input.tone || "professional";

    ui.recipient.value = data.input.recipient || "";
    ui.yourName.value = data.input.yourName || "J Roque";
    ui.ticket.value = data.input.ticket || "";
    ui.eta.value = data.input.eta || "";
    ui.issue.value = data.input.issue || "";
    ui.tried.value = data.input.tried || "";
    ui.error.value = data.input.error || "";
    ui.next.value = data.input.next || "";

    ui.draftOut.value = data.draft || "";
    ui.promptOut.value = data.prompt || "";
    setStatus("Restored last draft from this browser.");
  } catch {
    // ignore
  }
}

function generate() {
  const input = readInput();
  const draft = buildDraft(input);
  const prompt = buildPrompt(input);

  ui.draftOut.value = draft;
  ui.promptOut.value = prompt;

  save(input);
  setStatus("Generated. Copy the draft or the AI prompt.");
}

function clearAll() {
  ui.recipient.value = "";
  ui.ticket.value = "";
  ui.eta.value = "";
  ui.issue.value = "";
  ui.tried.value = "";
  ui.error.value = "";
  ui.next.value = "";
  ui.draftOut.value = "";
  ui.promptOut.value = "";
  setStatus("Cleared.");
}

ui.generateBtn.addEventListener("click", generate);

ui.copyDraftBtn.addEventListener("click", async () => {
  const ok = await copyToClipboard(ui.draftOut.value);
  setStatus(ok ? "Draft copied." : "Nothing to copy.");
});

ui.copyPromptBtn.addEventListener("click", async () => {
  const ok = await copyToClipboard(ui.promptOut.value);
  setStatus(ok ? "AI prompt copied." : "Nothing to copy.");
});

ui.clearBtn.addEventListener("click", clearAll);

restore();
