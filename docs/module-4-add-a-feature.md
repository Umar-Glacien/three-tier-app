# Module 4 — Add a Feature: Due Dates

**Duration:** 40 minutes · **Before you start:** Module 3 complete, your heading change live

Module 3 changed one word, so a fair objection is that the loop only looked easy
because the change was trivial. This module changes a form, a fetch call, a
Lambda handler and the shape of stored data — using the identical loop.

Each task gets an **optional due date**.

| Tier | File | Change |
|---|---|---|
| 1 | `frontend/index.html` | a date input |
| 1 | `frontend/app.js` | send `dueDate`, display it |
| 2 | `infrastructure/application-infrastructure.yaml` | store `dueDate` |
| 3 | *nothing* | explained below — this surprises people |

## 1. Branch

```bash
git switch main && git pull && git switch -c feature/due-dates
```

## 2. Add the field (Tier 1)

In `frontend/index.html`, add a second field between the task field and the
button, copying the existing `<div class="field">` wrapper so it inherits the
same spacing with no CSS change:

```html
        <div class="field">
          <label for="due-date">Due date (optional)</label>
          <input id="due-date" name="due-date" type="date">
        </div>
```

The id must be exactly `due-date`, because `app.js` looks it up by that id in
the next step. There is deliberately no `required` attribute — that is what makes
the backend change interesting.

## 3. Send it and show it (Tier 1)

In `frontend/app.js`, add the new input alongside the existing lookups near the
top:

```javascript
const dueDateInput = document.getElementById("due-date");
```

In `addRecord`, read it, send it, and clear it — three small edits:

```javascript
  const dueDate = dueDateInput.value;              // after the title check
  body: JSON.stringify({ title, dueDate }),        // was: { title }
  dueDateInput.value = "";                         // next to titleInput.value = ""
```

In `renderRecords`, replace the single `item.textContent = record.title;` line
with two spans:

```javascript
    const titleSpan = document.createElement("span");
    titleSpan.textContent = record.title;
    item.appendChild(titleSpan);

    // Records saved before this feature have no dueDate, so skip them.
    if (record.dueDate) {
      const dueSpan = document.createElement("span");
      dueSpan.className = "due-date";
      dueSpan.textContent = ` (due ${record.dueDate})`;
      item.appendChild(dueSpan);
    }
```

> ⚠️ **Keep `textContent`.** The tempting shortcut is
> `item.innerHTML = record.title + " (due " + record.dueDate + ")"`. Don't — that
> turns every task title into executable markup, so a task named
> `<img src=x onerror=alert(1)>` would *run*. Two spans with `textContent` give
> the same layout and keep the page safe.

## 4. Store it (Tier 2)

The Lambda code is **not** in `backend/add-record/` — that folder holds notes.
The real handler is the `ZipFile` block inside `AddRecordFunction` in
`infrastructure/application-infrastructure.yaml`. Add two lines:

```python
              # dueDate is optional - blank means no due date.
              due_date = str(body.get("dueDate") or "").strip()

              record = {
                  "todoId": str(uuid.uuid4()),
                  "title": title[:200],
                  "dueDate": due_date[:10],
                  "createdAt": datetime.now(timezone.utc).isoformat(),
              }
```

`or ""` means a missing key, `null` and `""` all become an empty string, so an
older client never causes an error. There is no `if not due_date: return 400` —
that is what "optional" means.

> ⚠️ **Indentation.** Inside `ZipFile: |` the Python sits at 10 spaces, with
> normal 4-space Python indentation inside that. Check before committing:
> `aws cloudformation validate-template --template-body file://infrastructure/application-infrastructure.yaml`

## 5. Two things you did NOT change

**The DynamoDB table.** `TodoTable` declares only `todoId` — no `title`, no
`createdAt`, yet every record already stores both. DynamoDB is *schemaless apart
from the key*; `AttributeDefinitions` only covers attributes used in a key or
index. So `dueDate` needs no `ALTER TABLE`, no migration, no downtime.

The trade-off: nothing validates your field names. Write `due_date` in one place
and `dueDate` in another and DynamoDB stores both cheerfully. The discipline a
relational schema enforces has moved into your code review.

**`GetRecordsFunction`.** It never names individual fields — it scans, sorts and
serialises whole items. The tier that *writes* a field is the tier that has to
learn about it.

## 6. Run the loop

Same as Module 3:

```bash
git diff                                    # expect three files, nothing else
git add frontend/index.html frontend/app.js infrastructure/application-infrastructure.yaml
git commit -m "Add optional due date to tasks"
git push -u origin feature/due-dates
```

Then: open the pull request, read the diff (notice the Lambda handler and the IAM
role that constrains it sit in the same diff — that is what infrastructure as
code buys a reviewer), merge, watch the pipeline start itself, and hard-refresh
the site.

## Checkpoint

- [ ] Both pipeline stages `Succeeded`
- [ ] The live site shows the **Due date (optional)** field
- [ ] A task with a date shows `(due YYYY-MM-DD)`; one without still saves
- [ ] **The due date survives a page reload**
- [ ] `aws dynamodb scan --table-name kuok-todo-dev-records` shows the attribute

The reload is the one that matters. A date shown right after clicking *Add task*
could be JavaScript echoing the response. A date that survives a reload made the
full trip: browser → API Gateway → Lambda → DynamoDB → Lambda → browser.

## What just happened

You changed three tiers through **one pull request**, and never opened the AWS
console. Module 3 changed one word; this changed a form, a fetch call, a handler
and the stored data. **The loop was identical.**

That is what a pipeline buys: the size of a change stops determining the risk of
shipping it.

Stuck or want more? [Troubleshooting](troubleshooting.md) ·
[Next steps](next-steps.md) · [Module 5 — Clean up](module-5-cleanup.md)
