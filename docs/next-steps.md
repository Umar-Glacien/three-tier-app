# Next Steps

You have run the loop twice — once for a text change, once for a feature across
all three tiers. The commands did not change, and they will not change again.

Here are six more features, easiest first. Every one goes through the identical
loop: branch, change, check, push, pull request, merge, watch the pipeline,
verify.

```bash
git switch main && git pull
git switch -c feature/<name>
# ...change, commit, push, open a PR, merge...
```

| # | Feature | Tiers touched | Done when |
|---|---|---|---|
| 1 | **Better empty state** — a friendlier message and a hint when there are no tasks | `app.js` | The message changes and no longer says "Loading…" once the API has replied |
| 2 | **Task counter** — show how many tasks exist, in the heading | `app.js` | The count updates after adding a task, without a page reload |
| 3 | **Inline validation** — show an error under the field instead of the message box when the title is blank | `index.html`, `app.js`, `style.css` | Submitting empty shows the error, and it clears when you type |
| 4 | **Priority colour coding** — high / normal / low, coloured in the list | all three tiers | The priority survives a page reload, so it came from DynamoDB |
| 5 | **Delete a task** — a button on each row | all three tiers, **new API route** | The task is gone from DynamoDB, not just from the page |
| 6 | **Mark complete** — a toggle, and completed tasks look different | all three tiers, **new API route** | The state survives a reload, and the count from #2 still makes sense |

## If your feature needs a new API route

Features 5 and 6 do. Copy the existing pattern in
`infrastructure/application-infrastructure.yaml` — each route needs **four**
resources plus a function and a role: an `AWS::ApiGatewayV2::Route`, an
`AWS::ApiGatewayV2::Integration`, an `AWS::Lambda::Permission`, and an
`AWS::Lambda::Function` with its own `AWS::IAM::Role`. Use the `AddRecord*` and
`GetRecords*` pairs as the template.

Three things that catch people:

- **CORS.** `CorsConfiguration.AllowMethods` currently lists `GET, POST,
  OPTIONS`. A `DELETE` or `PATCH` route fails at the browser's preflight check
  with nothing in the Lambda logs until you add it.
- **Permissions.** The existing roles allow only `PutItem` and `Scan`. A new
  function needs `DeleteItem` or `UpdateItem` added explicitly.
- **Path parameters** arrive at `event["pathParameters"]`, not in the body.

Your trainer has a longer version of this list with fuller hints.
