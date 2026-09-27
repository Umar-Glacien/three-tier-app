# Module 3 — The Developer Loop

**Duration:** 50 minutes · **Before you start:** Module 2 complete, pipeline green

This is the module the whole lab exists for. Everything before it was setup.

```
  main
    ├──► feature branch      make a change, test it, commit
    │      push              ← nothing deploys. This is the point.
    ├──► pull request        review the diff
    └──► merge to main       ← the pipeline starts, by itself
           CodePipeline deploys to DEV
           refresh the browser — your change is live
```

**A push is not a deployment. An approved merge is a deployment.**

## 1. Start clean

```bash
git switch main && git pull && git status
```

Expect `nothing to commit, working tree clean`. Starting dirty is the usual cause
of a confusing pull request later.

## 2. Branch

```bash
git switch -c feature/welcome-message
```

The name describes the change, not the person. `feature/welcome-message` tells a
reviewer what to expect; `poobalan-fix2` does not.

## 3. Make the change

In `frontend/index.html`, find:

```html
      <h1 id="page-heading">Welcome to Three Tier Application</h1>
```

Change the text to:

```html
      <h1 id="page-heading">Welcome to Kuok Group Cloud Application</h1>
```

That is the whole change. It is trivial on purpose — what you are learning is the
path the change takes, not the change.

```bash
git diff        # expect one file, one line removed, one added
```

## 4. Test locally

Open `frontend/index.html` in your browser (double-click it, or
`open frontend/index.html`).

You will see the new heading, an amber banner saying the page is running from a
local file, and a disabled **Add task** button. The banner is expected: opening
the file from disk means `app.js` still contains the `__API_BASE_URL__`
placeholder, so the page disables saving rather than failing with a confusing
network error.

**Be clear what this proves.** Your HTML is valid and the heading reads
correctly. It proves nothing about the API, CORS or IAM. Local testing catches
typos, not integration problems — which is why the pipeline exists.

## 5. Push — and prove nothing deployed

```bash
git add frontend/index.html
git commit -m "Change welcome heading to Kuok Group Cloud Application"
git push -u origin feature/welcome-message
```

Now the most important check in the lab. You just pushed code to GitHub. Did
anything happen in AWS?

```bash
aws codepipeline list-pipeline-executions --pipeline-name kuok-todo-dev-pipeline \
  --max-items 5 \
  --query "pipelineExecutionSummaries[].{Started:startTime,Status:status,Trigger:trigger.triggerType}" \
  --output table
```

**Expect no new execution.** The latest entry is still the one from Module 2.
Refresh the website — still the old heading.

**Why?** The Source action watches one branch, `main` — look at `BranchName` in
`pipeline/pipeline.yaml`. Your work sits safely on GitHub, visible to your team,
deploying to nothing. Work in progress never reaches an environment.

Do not take this on trust. Run the command and read the timestamp.

## 6. Open a pull request

Open the URL git printed, or use **Compare & pull request** on GitHub. Write a
title and a description that answers *why* — the diff already shows *what*:

```
Title:  Update welcome heading for Kuok Group
Body:   Customer-facing heading now names the Kuok Group Cloud Application,
        as agreed for the training environment.
```

Open the **Files changed** tab and read the diff as if it were a colleague's
work. One line removed, one added.

This is the review gate. In a real team a second person approves this before
anything reaches an environment — and that is what makes it safe to let the
pipeline run automatically.

## 7. Merge, and watch it start by itself

Open the CodePipeline console in another tab first so you can watch it react.
Then **Merge pull request → Confirm merge**.

Within about fifteen seconds the pipeline starts on its own. Nobody ran a
command. The connection you authorised installed a webhook; GitHub told AWS that
`main` changed; CodePipeline started.

Run the same command as in step 5 — now there *is* a new execution, with trigger
`Webhook`.

## 8. See it live

Once both stages are green, refresh the website. The heading now reads **"Welcome
to Kuok Group Cloud Application"**.

Still old? Hard refresh (`Cmd/Ctrl + Shift + R`) — your browser cached it. Then
tidy up:

```bash
git switch main && git pull && git branch -d feature/welcome-message
```

## Checkpoint

- [ ] Pushing the branch produced **no** pipeline execution
- [ ] The pull request showed exactly one changed line
- [ ] Merging started the pipeline **automatically**
- [ ] The live site shows the new heading

## What just happened

You deployed to DEV without running a deployment command. You merged an approved
pull request; AWS did the rest.

| Step | What it protected |
|---|---|
| Feature branch | Unfinished work never reaches an environment |
| Local test | Typos caught before anyone else's time is spent |
| Pull request | A second pair of eyes, and a written record of why |
| Merge to `main` | One unambiguous definition of "deployed" |
| Pipeline | The same steps, the same way, every time |

The pipeline is the least interesting item on that list. Anyone can automate a
deployment; the discipline about *what* gets deployed is what makes the
automation safe.

**Next:** [Module 4 — Add a feature](module-4-add-a-feature.md)
