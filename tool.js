const CONFIG = {
  portfolioUrl: "https://j8roque.github.io/",
  repoUrl: "https://github.com/J8Roque/it-message-writer",
  scenarios: [
    "Account locked",
    "Password reset",
    "MFA not working",
    "VPN connection issue",
    "WiFi connection issue",
    "Outlook email issue",
    "Printer issue",
    "Software install request",
    "Access request",
    "Other"
  ]
};

const el = (id) => document.getElementById(id);

const state = {
  lastDraft: "",
  lastPrompt: ""
};

function setToast(msg) {
  const t = el("toast");
  t.textContent = msg;
  if (!msg) return;
  window.clearTimeout(setToast._timer);
  setToast._timer = window.setTimeout(() => (t.textContent = ""), 1800);
}

async function copyText(text) {
  await navigator.clipboard.writeText(text);
  setToast("Copied ✅");
}

function clean(v) {
  return (v || "").trim();
}

function buildDraft(inputs) {
  const type = inputs.messageType;
  const scenario = inputs.scenario;
  const tone = inputs.tone;
  const yourName = inputs.yourName || "IT Support";
  const recipient = inputs.recipient;
  const ticket = inputs.ticket;
  const eta = inputs.eta;
  const summary = inputs.summary;
  const tried = inputs.tried;
  const nextStep = inputs.nextStep;

  const greeting = recipient ? `Hi ${recipient},` : "Hi,";
  const closing = `Regards,\n${yourName}`;

  const toneLine =
    tone === "Friendly"
      ? "Thanks for reaching out. I can help with this."
      : tone === "Firm"
      ? "Thanks for the update. Let’s get this resolved."
      : "Thanks for reaching out. I’m following up on this.";

  const subjectBase = ticket ? `${scenario} (${ticket})` : scenario;

  const lines = [];
  if (type === "Email") {
    lines.push(`Subject: ${subjectBase}`);
    lines.push("");
    lines.push(greeting);
    lines.push("");
    lines.push(toneLine);
    lines.push(`Issue summary: ${summary}`);

    if (tried) lines.push(`What was tried: ${tried}`);
    if (eta) lines.push(`ETA or timeframe: ${eta}`);
    if (nextStep) lines.push(`Next step: ${nextStep}`);
    else lines.push("Next step: Please reply with any relevant details so we can proceed.");

    lines.push("");
    lines.push(closing);
  }

  if (type === "Chat") {
    lines.push(`${greeting} ${toneLine}`);
    lines.push(`Summary: ${summary}`);
    if (tried) lines.push(`Tried: ${tried}`);
    if (eta) lines.push(`ETA: ${eta}`);
    lines.push(nextStep ? `Next: ${nextStep}` : "Next: Please share any error message or what you see on screen.");
    lines.push(`Thanks, ${yourName}`);
  }

  if (type === "Ticket update") {
    lines.push(`${ticket ? `${ticket} ` : ""}${scenario} update`);
    lines.push("");
    lines.push(`Summary: ${summary}`);
    if (tried) lines.push(`Tried: ${tried}`);
    if (eta) lines.push(`ETA: ${eta}`);
    lines.push(`Next: ${nextStep || "Awaiting user confirmation or additional details."}`);
    lines.push(`Owner: ${yourName}`);
  }

  return lines.join("\n");
}

function buildPrompt(inputs, draft) {
  const safeReminder =
    "Do not include passwords, private keys, SSNs, or sensitive personal data. Keep it concise and professional.";

  return [
    "You are an IT support professional.",
    "Rewrite the draft below to be clearer, shorter, and more helpful.",
    safeReminder,
    "",
    `Message type: ${inputs.messageType}`,
    `Scenario: ${inputs.scenario}`,
    `Tone: ${inputs.tone}`,
    "",
    "Draft to improve:",
    draft
  ].join("\n");
}

function readInputs() {
  return {
    messageType: el("messageType").value,
    scenario: el("scenario").value,
    tone: el("tone").value,
    yourName: clean(el("yourName").value),
    recipient: clean(el("recipient").value),
    ticket: clean(el("ticket").value),
    eta: clean(el("eta").value),
    summary: clean(el("summary").value),
    tried: clean(el("tried").value),
    nextStep: clean(el("nextStep").value)
  };
}

function validate(inputs) {
  if (!inputs.summary) {
    setToast("Add an issue summary first.");
    el("summary").focus();
    return false;
  }
  return true;
}

function onGenerate() {
  const inputs = readInputs();
  if (!validate(inputs)) return;

  if (inputs.yourName) localStorage.setItem("itmw_yourName", inputs.yourName);

  const draft = buildDraft(inputs);
  const prompt = buildPrompt(inputs, draft);

  state.lastDraft = draft;
  state.lastPrompt = prompt;

  el("draftOut").textContent = draft;
  el("promptOut").textContent = prompt;

  el("btnCopyDraft").disabled = false;
  el("btnCopyPrompt").disabled = false;

  setToast("Generated ✅");
}

function onClear() {
  el("recipient").value = "";
  el("ticket").value = "";
  el("eta").value = "";
  el("summary").value = "";
  el("tried").value = "";
  el("nextStep").value = "";

  state.lastDraft = "";
  state.lastPrompt = "";
  el("draftOut").textContent = "Fill the form and click Generate.";
  el("promptOut").textContent = "Generate a draft first to create the prompt.";

  el("btnCopyDraft").disabled = true;
  el("btnCopyPrompt").disabled = true;

  setToast("Cleared");
}

function init() {
  el("btnPortfolio").href = CONFIG.portfolioUrl;
  el("btnRepo").href = CONFIG.repoUrl;

  const scenarioEl = el("scenario");
  CONFIG.scenarios.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    scenarioEl.appendChild(opt);
  });
  scenarioEl.value = "Account locked";

  const savedName = localStorage.getItem("itmw_yourName");
  el("yourName").value = savedName || "J Roque";

  el("btnGenerate").addEventListener("click", onGenerate);
  el("btnClear").addEventListener("click", onClear);

  el("btnCopyDraft").addEventListener("click", async () => {
    if (!state.lastDraft) return;
    await copyText(state.lastDraft);
  });

  el("btnCopyPrompt").addEventListener("click", async () => {
    if (!state.lastPrompt) return;
    await copyText(state.lastPrompt);
  });
}

document.addEventListener("DOMContentLoaded", init);
