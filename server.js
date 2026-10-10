
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "20kb" }));
app.use(express.static(path.join(__dirname)));

let tasks = [];
let nextId = 1;

app.get("/api/tasks", (req, res) => {
  res.json(tasks);
});

app.post("/api/tasks", (req, res) => {
  const { text, priority = "Medium", dueDate = "" } = req.body;

  if (typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "Task name is required." });
  }

  if (text.trim().length > 200) {
    return res.status(400).json({ error: "Task name is too long." });
  }

  if (!["Low", "Medium", "High"].includes(priority)) {
    return res.status(400).json({ error: "Invalid priority." });
  }

  const task = {
    id: nextId++,
    text: text.trim(),
    priority,
    dueDate: typeof dueDate === "string" ? dueDate : "",
    completed: false
  };

  tasks.push(task);
  res.status(201).json(task);
});

app.put("/api/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const task = tasks.find(item => item.id === id);

  if (!task) {
    return res.status(404).json({ error: "Task not found." });
  }

  const { text, priority, dueDate } = req.body;

  if (typeof text !== "string" || !text.trim() || text.trim().length > 200) {
    return res.status(400).json({ error: "Enter a valid task name." });
  }

  if (!["Low", "Medium", "High"].includes(priority)) {
    return res.status(400).json({ error: "Invalid priority." });
  }

  task.text = text.trim();
  task.priority = priority;
  task.dueDate = typeof dueDate === "string" ? dueDate : "";

  res.json(task);
});

app.patch("/api/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const task = tasks.find(item => item.id === id);

  if (!task) {
    return res.status(404).json({ error: "Task not found." });
  }

  if (typeof req.body.completed !== "boolean") {
    return res.status(400).json({
      error: "Completed must be true or false."
    });
  }

  task.completed = req.body.completed;
  res.json(task);
});

app.delete("/api/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = tasks.findIndex(item => item.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Task not found." });
  }

  tasks.splice(index, 1);
  res.json({ message: "Task deleted successfully." });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Task Manager running at http://localhost:${PORT}`);
});
