# Three-Tier Application — Kuok Group Training Lab

A small three-tier application and the smallest CI/CD pipeline that deploys it,
built to teach one thing:

> **Feature branch → pull request → merge to `main` → AWS deploys it, by itself.**

The application is just the vehicle. The workflow is the lesson.

## Architecture

```
Browser
   │
   ▼
Amazon S3 (static website)           Tier 1 — index.html, app.js, style.css
   │  fetch()
   ▼
Amazon API Gateway (HTTP API)        Tier 2 — two routes
   ├── POST /records ──► Lambda  kuok-todo-dev-add-record
   └── GET  /records ──► Lambda  kuok-todo-dev-get-records
                            │
                            ▼
                     Amazon DynamoDB            Tier 3 — kuok-todo-dev-records
```

Deployment: a merge into `main` triggers CodePipeline, which runs CloudFormation
and then publishes the website. **Two stages, that is all.**

## The lab

| Module | What you do | Time |
|---|---|---|
| [0 — Prerequisites](docs/00-prerequisites.md) | Check your tools and account | 10 min |
| [1 — Deploy the infrastructure](docs/module-1-deploy-infrastructure.md) | One command builds all three tiers | 45 min |
| [2 — Create the pipeline](docs/module-2-create-pipeline.md) | Put the app behind CodePipeline | 40 min |
| [3 — The developer loop](docs/module-3-developer-loop.md) | Branch → PR → merge → automatic deploy | 50 min |
| [4 — Add a feature](docs/module-4-add-a-feature.md) | Due dates, across all three tiers | 40 min |
| [5 — Clean up](docs/module-5-cleanup.md) | Delete everything | 15 min |

Keep [the quick reference](docs/quick-reference.md) open beside whichever module you
are on — every command in the lab on one page.

Stuck? [Troubleshooting](docs/troubleshooting.md). Finished early?
[Next steps](docs/next-steps.md).

## Repository layout

```
three-tier-app/
├── frontend/           Tier 1 — the static website
├── backend/            Tier 2 — see the note below
├── infrastructure/
│   └── application-infrastructure.yaml    the three tiers
├── pipeline/
│   └── pipeline.yaml                      the CI/CD pipeline
├── buildspec.yml       what CodeBuild runs, all twelve lines of it
└── docs/               this lab
```

> **Where is the Lambda code?** Inline in
> `infrastructure/application-infrastructure.yaml`, as `AddRecordFunction` and
> `GetRecordsFunction`. That way CloudFormation alone deploys the backend — no
> build step and no zip files. `backend/add-record/README.md` explains the
> trade-off.

## Getting your own copy

This repository is a **template**. Choose **Use this template → Create a new
repository** to get your own copy, then clone it. You push to your own
repository during the lab, and that is what the pipeline deploys.

It has two branches: `main` is the starter application, and `solution` holds the
finished Module 4 feature for checking your own work afterwards.

## What this lab deliberately does not do

Say these out loud before you copy anything here into a real system:

- **The S3 bucket is public.** Website hosting needs it. Production puts
  CloudFront in front and keeps the bucket private.
- **The API has no authentication.** Anyone with the URL can read and write your
  records. Production adds a Cognito or IAM authorizer, and throttling.
- **`get-records` uses `Scan`.** Fine for a handful of rows, wrong at scale.
- **There is no test stage, no approval gate and no production environment.**
  Out of scope today, and the natural next lab.

Your trainer has the full version of this list. It is also why
[Module 5](docs/module-5-cleanup.md) is not optional — do not leave a public,
unauthenticated API running after the session.

## Cost

About **USD 0–2** for a full run. Everything is free-tier or negligible at this
volume; CodePipeline is roughly $1/month per active pipeline.
