# Troubleshooting

The six failures participants hit most often in this lab. Every command assumes
`AWS_PROFILE` and `AWS_REGION` are exported, and `<AWS_ACCOUNT_ID>` is your account ID.

---

**Source stage fails and the connection is `PENDING`.**
A connection created by CloudFormation is always born `PENDING` — CloudFormation cannot
log in to GitHub for you, so a human has to authorise it once.

Console: **Developer Tools** → **Settings** → **Connections** → select
`kuok-todo-dev-github` → **Update pending connection**. When it reads `Available`, run
the pipeline again:

```bash
aws codepipeline start-pipeline-execution --name kuok-todo-dev-pipeline
```

---

**Connection is `AVAILABLE` but Source fails with `No Branch [main] found`.**
Authorising the GitHub App is not the same as installing it. The connection goes
`AVAILABLE` on authorisation alone, but without an installation the connector can see no
repository at all — which GitHub reports as a missing branch.

Open **https://github.com/settings/installations** — this is the *Installed* tab, not
*Authorized*. It must list **AWS Connector for GitHub**.

- Listed: choose **Configure** and set **Repository access** to **All repositories**.
- Empty: install it at
  **https://github.com/apps/aws-connector-for-github/installations/new**, choosing
  **All repositories**.

Then start the pipeline again with the command above.

---

**Stack stuck in `ROLLBACK_COMPLETE`.**
The first create failed, so the stack holds nothing to update from; the only operation
CloudFormation will accept is deletion.

Read the **first** `CREATE_FAILED`, not the last — events come back newest-first, and the
newest failure is usually a cascade from the real one:

```bash
aws cloudformation describe-stack-events \
  --stack-name kuok-todo-dev-cicd \
  --query "reverse(StackEvents[?ResourceStatus=='CREATE_FAILED'].[LogicalResourceId,ResourceStatusReason])" \
  --output table
```

Fix that cause, delete the stack, then deploy again:

```bash
aws cloudformation delete-stack --stack-name kuok-todo-dev-cicd
aws cloudformation wait stack-delete-complete --stack-name kuok-todo-dev-cicd
```

---

**Website shows "Could not load tasks".**
The page loaded from S3 but could not reach the API — most often because the build never
replaced the `__API_BASE_URL__` placeholder in `app.js`.

```bash
aws s3 cp "s3://kuok-todo-dev-site-<AWS_ACCOUNT_ID>/app.js" - | head -3
```

A real `execute-api` URL means the substitution worked. The placeholder means the
**PublishFrontend** step did not succeed — read its log:

```bash
aws logs tail /aws/codebuild/kuok-todo-dev-publish-frontend --since 30m
```

If the URL is correct, open the browser developer tools and read the Console and Network
tabs for the `records` request.

---

**Website still shows the old heading.**
Almost always the browser cache; occasionally a pipeline run that has not finished.

Hard refresh with `Cmd`+`Shift`+`R` (macOS) or `Ctrl`+`F5` (Windows/Linux), or open the
site in a private window. If it is still old, confirm the run actually succeeded:

```bash
aws codepipeline list-pipeline-executions \
  --pipeline-name kuok-todo-dev-pipeline --max-items 5 \
  --query "pipelineExecutionSummaries[].[startTime,status]" --output table
```

---

**Pipeline did not start after a merge.**
Either the commit is not on `main`, the connection is unusable, or change detection is
off. A push to a feature branch is *supposed* to do nothing — only a merge into `main`
deploys.

```bash
git fetch origin && git log --oneline -3 origin/main

aws codeconnections list-connections \
  --query "Connections[?ConnectionName=='kuok-todo-dev-github'].[ConnectionName,ConnectionStatus]" \
  --output table

aws codepipeline get-pipeline --name kuok-todo-dev-pipeline \
  --query "pipeline.stages[0].actions[0].configuration" --output table
```

Your merge commit must appear in the log, the connection must read `AVAILABLE`, and
`DetectChanges` must read `true`.

---

For anything not listed here, ask your trainer — the full reference is in the instructor
pack.
