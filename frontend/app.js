// The placeholder below is replaced with the real API Gateway endpoint when
// the pipeline publishes this file to S3 (see buildspec.yml).
const API_BASE_URL = "__API_BASE_URL__";

const RUNNING_LOCALLY = API_BASE_URL.includes("__API");

const form = document.getElementById("todo-form");
const titleInput = document.getElementById("title");
const submitButton = document.getElementById("submit-button");
const recordList = document.getElementById("records");
const messageBox = document.getElementById("message");

function showMessage(text, isError) {
  messageBox.textContent = text;
  messageBox.className = isError ? "message error" : "message success";
  messageBox.hidden = false;
}

function renderRecords(records) {
  recordList.innerHTML = "";

  if (records.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = "No tasks yet. Add your first one above.";
    recordList.appendChild(empty);
    return;
  }

  records.forEach((record) => {
    const item = document.createElement("li");
    // textContent (not innerHTML) so a task title can never inject markup.
    item.textContent = record.title;
    recordList.appendChild(item);
  });
}

async function loadRecords() {
  try {
    const response = await fetch(`${API_BASE_URL}/records`);
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    const data = await response.json();
    renderRecords(data.records || []);
  } catch (error) {
    recordList.innerHTML = "";
    showMessage(`Could not load tasks: ${error.message}`, true);
  }
}

async function addRecord(event) {
  event.preventDefault();

  const title = titleInput.value.trim();
  if (!title) {
    return;
  }

  submitButton.disabled = true;
  try {
    const response = await fetch(`${API_BASE_URL}/records`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });

    if (!response.ok) {
      const problem = await response.json().catch(() => ({}));
      throw new Error(problem.message || `API returned ${response.status}`);
    }

    titleInput.value = "";
    showMessage("Task saved.", false);
    await loadRecords();
  } catch (error) {
    showMessage(`Could not save the task: ${error.message}`, true);
  } finally {
    submitButton.disabled = false;
  }
}

if (RUNNING_LOCALLY) {
  // Opened straight from disk during a local test: show the page, skip the API.
  document.getElementById("local-banner").hidden = false;
  submitButton.disabled = true;
  renderRecords([]);
} else {
  form.addEventListener("submit", addRecord);
  loadRecords();
}
