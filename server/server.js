const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, "submissions.json");

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

function readData() {
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]", "utf8");
  const raw = fs.readFileSync(DATA_FILE, "utf8").replace(/^\uFEFF/, "");
  return JSON.parse(raw || "[]");
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

app.get("/api/submissions", (req, res) => res.json(readData()));

app.post("/api/submissions", (req, res) => {
  const email = req.body.email || "";
  const subscriptionNumber = req.body.subscriptionNumber || "";
  const selectedFix = req.body.selectedFix || "";

  if (!email && !subscriptionNumber) return res.status(400).json({ error: "missing data" });
  if (!selectedFix) return res.status(400).json({ error: "missing fix" });

  const data = readData();
  const item = {
    id: Date.now().toString(),
    email,
    subscriptionNumber,
    selectedFix,
    status: "undone",
    createdAt: new Date().toISOString()
  };

  data.unshift(item);
  writeData(data);
  res.json(item);
});

app.patch("/api/submissions/:id/done", (req, res) => {
  const data = readData();
  const item = data.find(x => x.id === req.params.id);
  if (!item) return res.status(404).json({ error: "not found" });

  item.status = "done";
  item.updatedAt = new Date().toISOString();
  writeData(data);
  res.json(item);
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.listen(PORT, () => console.log("Website running: http://localhost:" + PORT));
