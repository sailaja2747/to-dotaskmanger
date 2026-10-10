
const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const priorityInput = document.getElementById("priorityInput");
const dueDateInput = document.getElementById("dueDateInput");
const taskList = document.getElementById("taskList");
const filterInput = document.getElementById("filterInput");
const message = document.getElementById("message");
const submitButton = document.getElementById("submitButton");
const cancelEdit = document.getElementById("cancelEdit");

let tasks = [];
let editingId = null;

function showMessage(text) {
  message.textContent = text;
}

async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Something went wrong");
  }

  return data;
}

async function loadTasks() {
  try {
    tasks = await api("/api/tasks");
    renderTasks();
    showMessage("");
  } catch (error) {
    showMessage("Could not connect to the server. Please restart it.");
  }
}

taskForm.addEventListener("submit", async event => {
  event.preventDefault();

  const text = taskInput.value.trim();
  if (!text) {
    showMessage("Please enter a task.");
    return;
  }

  const payload = {
    text,
    priority: priorityInput.value,
    dueDate: dueDateInput.value
  };

  submitButton.disabled = true;

  try {
    if (editingId !== null) {
      await api(`/api/tasks/${editingId}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      showMessage("Task updated successfully!");
    } else {
      await api("/api/tasks", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      showMessage("Task added successfully!");
    }

    resetForm();
    await loadTasks();
  } catch (error) {
    showMessage(error.message);
  } finally {
    submitButton.disabled = false;
  }
});

function resetForm() {
  editingId = null;
  taskForm.reset();
  priorityInput.value = "Medium";
  submitButton.textContent = "+ Add Task";
  cancelEdit.hidden = true;
  document.getElementById("formTitle").textContent = "Add a New Task";
}

cancelEdit.addEventListener("click", resetForm);

filterInput.addEventListener("change", renderTasks);

function renderTasks() {
  taskList.replaceChildren();

  const filter = filterInput.value;
  const visibleTasks = tasks.filter(task => {
    if (filter === "Pending") return !task.completed;
    if (filter === "Completed") return task.completed;
    return true;
  });

  document.getElementById("totalCount").textContent = tasks.length;
  document.getElementById("pendingCount").textContent =
    tasks.filter(task => !task.completed).length;
  document.getElementById("completedCount").textContent =
    tasks.filter(task => task.completed).length;

  if (visibleTasks.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = "No tasks here. Add a task to get started!";
    taskList.appendChild(empty);
    return;
  }

  visibleTasks.forEach(task => {
    const item = document.createElement("li");
    item.className = "task-item";
    if (task.completed) item.classList.add("completed");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.setAttribute("aria-label", "Mark task complete");
    checkbox.addEventListener("change", () => toggleTask(task));

    const info = document.createElement("div");
    info.className = "task-info";

    const title = document.createElement("p");
    title.className = "task-title";
    title.textContent = task.text;

    const meta = document.createElement("div");
    meta.className = "task-meta";

    const priority = document.createElement("span");
    priority.className = `priority ${task.priority}`;
    priority.textContent = `${task.priority} priority`;
    meta.appendChild(priority);

    if (task.dueDate) {
      const due = document.createElement("span");
      due.textContent = `Due: ${task.dueDate}`;
      meta.appendChild(due);
    }

    info.append(title, meta);

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "edit-btn";
    edit.textContent = "Edit";
    edit.addEventListener("click", () => startEdit(task));

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "delete-btn";
    remove.textContent = "Delete";
    remove.addEventListener("click", () => deleteTask(task.id));

    actions.append(edit, remove);
    item.append(checkbox, info, actions);
    taskList.appendChild(item);
  });
}

async function toggleTask(task) {
  try {
    await api(`/api/tasks/${task.id}`, {
      method: "PATCH",
      body: JSON.stringify({ completed: !task.completed })
    });
    await loadTasks();
  } catch (error) {
    showMessage(error.message);
  }
}

function startEdit(task) {
  editingId = task.id;
  taskInput.value = task.text;
  priorityInput.value = task.priority;
  dueDateInput.value = task.dueDate || "";
  submitButton.textContent = "Save Changes";
  cancelEdit.hidden = false;
  document.getElementById("formTitle").textContent = "Edit Task";
  taskInput.focus();
}

async function deleteTask(id) {
  if (!confirm("Are you sure you want to delete this task?")) return;

  try {
    await api(`/api/tasks/${id}`, { method: "DELETE" });
    if (editingId === id) resetForm();
    showMessage("Task deleted.");
    await loadTasks();
  } catch (error) {
    showMessage(error.message);
  }
}

loadTasks();
