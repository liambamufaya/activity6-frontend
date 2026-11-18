const KEY = "library-service-demo-v1";

const SEED = [
  { id: 1, title: "Find a database design textbook", category: "Book search", description: "Looking for a recent textbook on relational database design for ICT course.", status: "Pending" },
  { id: 2, title: "Extend loan on two books", category: "Borrowing", description: "I need two more weeks for books due on Friday. Both have no holds.", status: "In progress" },
  { id: 3, title: "Cannot log in to library account", category: "Account help", description: "My student number is rejected when I try to sign in to the catalogue.", status: "Pending" },
  { id: 4, title: "Book a group study room", category: "Study room", description: "Need a room for six people on Saturday morning for a project meeting.", status: "Completed" },
  { id: 5, title: "Printer on level 2 is jammed", category: "Printing", description: "The printer near the periodicals shelf shows a paper jam error.", status: "In progress" },
  { id: 6, title: "Help finding journal articles", category: "Research help", description: "Need guidance searching for peer-reviewed articles on renewable energy.", status: "Pending" },
  { id: 7, title: "Reserve a borrowed networking book", category: "Borrowing", description: "Please place a hold on Computer Networks as it is currently on loan.", status: "Completed" },
  { id: 8, title: "Update my contact details", category: "Account help", description: "My phone number changed and I want the library records updated.", status: "Pending" }
];

function load() {
  const raw = localStorage.getItem(KEY);
  if (raw === null) { save(SEED); return structuredClone(SEED); }
  try { return JSON.parse(raw); } catch { save(SEED); return structuredClone(SEED); }
}
function save(records) { localStorage.setItem(KEY, JSON.stringify(records)); }
const clean = r => ({ title: r.title, category: r.category, description: r.description, status: r.status });

export const recordService = {
  async list() { return load(); },

  async get(id) {
    const rec = load().find(r => r.id === Number(id));
    if (!rec) throw new Error("Record not found.");
    return rec;
  },

  async create(record) {
    const records = load();
    const id = records.reduce((max, r) => Math.max(max, r.id), 0) + 1;
    const created = { id, ...clean(record) };
    records.push(created);
    save(records);
    return created;
  },

  async update(id, record) {
    const records = load();
    const i = records.findIndex(r => r.id === Number(id));
    if (i === -1) throw new Error("Record not found.");
    records[i] = { id: records[i].id, ...clean(record) };
    save(records);
    return records[i];
  },

  async remove(id) {
    const records = load();
    const i = records.findIndex(r => r.id === Number(id));
    if (i === -1) throw new Error("Record not found.");
    records.splice(i, 1);
    save(records);
    return { message: "Record deleted." };
  }
};
