import { recordService } from "./data.js";

const $ = id => document.getElementById(id);
const form = $("record-form"), fields = { title: $("title"), category: $("category"), description: $("description"), status: $("status") };
const idField = $("record-id"), saveBtn = $("save-btn"), cancelBtn = $("cancel-btn");
const list = $("record-list"), countEl = $("count"), emptyEl = $("empty"), msg = $("message");
const search = $("search"), filter = $("filter"), details = $("details");
const STATUSES = ["Pending", "In progress", "Completed"];
let records = [], msgTimer;

function showMessage(text, isError = false) {
  msg.textContent = text;
  msg.className = "message" + (isError ? " error-msg" : "");
  msg.hidden = false;
  clearTimeout(msgTimer);
  msgTimer = setTimeout(() => { msg.hidden = true; }, 6000);
}

function validate() {
  const v = {
    title: fields.title.value.trim(), category: fields.category.value.trim(),
    description: fields.description.value.trim(), status: fields.status.value
  };
  const errors = {};
  if (v.title.length < 3 || v.title.length > 80) errors.title = "Enter a title of 3 to 80 characters.";
  if (v.category.length < 2 || v.category.length > 40) errors.category = "Enter a category of 2 to 40 characters.";
  if (v.description.length < 5 || v.description.length > 300) errors.description = "Enter a description of 5 to 300 characters.";
  if (!STATUSES.includes(v.status)) errors.status = "Choose a valid status.";
  return { v, errors };
}

function showErrors(errors) {
  for (const name of ["title", "category", "description"]) {
    $(name + "-error").textContent = errors[name] || "";
    fields[name].setAttribute("aria-invalid", errors[name] ? "true" : "false");
  }
}

function resetForm() {
  form.reset();
  idField.value = "";
  $("form-title").textContent = "Add a request";
  saveBtn.textContent = "Add request";
  cancelBtn.hidden = true;
  showErrors({});
}

function statusClass(s) { return s === "Completed" ? "s-done" : s === "In progress" ? "s-progress" : "s-pending"; }

function render() {
  const q = search.value.trim().toLowerCase(), f = filter.value;
  const shown = records.filter(r => r.title.toLowerCase().includes(q) && (!f || r.status === f));
  list.replaceChildren();
  countEl.textContent = `Showing ${shown.length} of ${records.length} ${records.length === 1 ? "request" : "requests"}`;

  emptyEl.hidden = shown.length > 0;
  if (!shown.length) {
    emptyEl.textContent = records.length === 0
      ? "No requests yet. Use the form to add the first one."
      : "No requests match your search or filter. Clear them to see all requests.";
  }

  for (const r of shown) {
    const li = document.createElement("li");
    li.className = "record " + statusClass(r.status);
    const h = document.createElement("h3"); h.textContent = r.title;
    const meta = document.createElement("p"); meta.className = "meta"; meta.textContent = `#${r.id} \u2022 ${r.category}`;
    const badge = document.createElement("span"); badge.className = "badge"; badge.textContent = r.status;
    const actions = document.createElement("div"); actions.className = "actions";
    for (const [label, action, extra] of [["View", "view", ""], ["Edit", "edit", ""], ["Delete", "delete", " danger"]]) {
      const b = document.createElement("button");
      b.type = "button"; b.className = "btn" + extra; b.textContent = label;
      b.dataset.action = action; b.dataset.id = r.id;
      b.setAttribute("aria-label", `${label} request ${r.id}: ${r.title}`);
      actions.append(b);
    }
    li.append(h, meta, badge, actions);
    list.append(li);
  }
}

async function refresh() {
  try { records = await recordService.list(); render(); }
  catch (e) { showMessage("Could not load requests: " + e.message, true); }
}

form.addEventListener("submit", async e => {
  e.preventDefault();
  const { v, errors } = validate();
  showErrors(errors);
  if (Object.keys(errors).length) {
    showMessage("Please fix the highlighted fields. Nothing was saved.", true);
    form.querySelector('[aria-invalid="true"]')?.focus();
    return;
  }
  try {
    if (idField.value) {
      await recordService.update(idField.value, v);
      showMessage("Request updated successfully.");
    } else {
      await recordService.create(v);
      showMessage("Request added successfully.");
    }
    resetForm();
    await refresh();
  } catch (err) { showMessage("Could not save: " + err.message, true); }
});

cancelBtn.addEventListener("click", () => { resetForm(); showMessage("Edit cancelled."); });

list.addEventListener("click", async e => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const id = Number(btn.dataset.id);
  try {
    if (btn.dataset.action === "view") {
      showDetails(await recordService.get(id));
    } else if (btn.dataset.action === "edit") {
      const r = await recordService.get(id);
      idField.value = r.id;
      for (const k of Object.keys(fields)) fields[k].value = r[k];
      showErrors({});
      $("form-title").textContent = `Edit request #${r.id}`;
      saveBtn.textContent = "Save changes";
      cancelBtn.hidden = false;
      form.scrollIntoView({ behavior: "smooth", block: "start" });
      fields.title.focus();
    } else if (btn.dataset.action === "delete") {
      const r = await recordService.get(id);
      if (!confirm(`Delete request #${r.id} "${r.title}"? This cannot be undone.`)) return;
      const res = await recordService.remove(id);
      if (idField.value === String(id)) resetForm();
      if (!details.hidden && details.dataset.id === String(id)) details.hidden = true;
      showMessage(res.message);
      await refresh();
    }
  } catch (err) { showMessage(err.message, true); }
});

function showDetails(r) {
  const body = $("details-body");
  body.replaceChildren();
  for (const [k, val] of [["ID", r.id], ["Title", r.title], ["Category", r.category], ["Description", r.description], ["Status", r.status]]) {
    const dt = document.createElement("dt"); dt.textContent = k;
    const dd = document.createElement("dd"); dd.textContent = val;
    body.append(dt, dd);
  }
  details.dataset.id = r.id;
  details.hidden = false;
  details.focus();
  details.scrollIntoView({ behavior: "smooth", block: "nearest" });
}
$("close-details").addEventListener("click", () => { details.hidden = true; });

search.addEventListener("input", render);
filter.addEventListener("change", render);
refresh();
