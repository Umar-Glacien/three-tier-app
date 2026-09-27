# Lambda 2 — get-records

**The code for this function is not in this folder.** It lives inline in the
CloudFormation template, as the `GetRecordsFunction` resource:

    infrastructure/application-infrastructure.yaml

## Why inline?

Keeping the handler inside the template means CloudFormation alone deploys the
backend. There is no build step, no zip file and no artifact bucket for code —
which is exactly the simplicity this lab is aiming for. You edit the Python in
the template, merge to `main`, and the pipeline's CloudFormation action updates
the running function.

The trade-off is a hard AWS limit of **4096 characters** of inline code per
function. The current handler uses about a seventh of that.

## What it does

| | |
|---|---|
| Route | `GET /records` |
| Input | none |
| Output | `200` and `{"records": [...]}`, newest first |
| Permissions | `dynamodb:Scan` on the lab table, and nothing else |

## If you outgrow inline code

Move the handler into `lambda_function.py` here, then have the pipeline run
`aws cloudformation package` before the deploy action. That swaps roughly ten
lines of template for a real source file — worth it on a real project, not for
this lab.
