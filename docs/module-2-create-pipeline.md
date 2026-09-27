# Module 2 — Create the Pipeline

**Duration:** 40 minutes · **Before you start:** Module 1 complete, website working

## 1. Push your code to GitHub

The pipeline deploys *approved code from a repository*, so there must be one. You
created yours from the template in Module 0. If you have not pushed yet:

```bash
git add . && git commit -m "Initial commit" && git push -u origin main
```

The pipeline can only deploy what it can see, so confirm your code is on GitHub
before continuing.

## 2. Read the pipeline template

Open `pipeline/pipeline.yaml`. Eight resources — you should be able to explain
each one by the end of this module:

| Resource | Why it exists |
|---|---|
| `GitHubConnection` | How AWS is allowed to read your repository |
| `ArtifactBucket` | Where CodePipeline hands files between stages |
| `CloudFormationDeployRole` | The role CloudFormation assumes to build your app |
| `CodeBuildServiceRole` | Lets the publish step read outputs and write to the bucket |
| `CodePipelineServiceRole` | Lets the pipeline use the connection, bucket, CFN and CodeBuild |
| `FrontendPublishLogGroup` | The publish step's logs — declared so teardown removes them |
| `FrontendPublishProject` | The CodeBuild project that runs `buildspec.yml` |
| `Pipeline` | Two stages, below |

```
Source                            Deploy
└── watches main on your repo     ├── 1. CloudFormation creates/updates the app stack
                                  └── 2. CodeBuild publishes the website to S3
```

**Order matters.** The publish step reads the bucket name and API URL from the
app stack's Outputs, which only exist after CloudFormation has run. `RunOrder`
guarantees it.

**Where is the deployment logic?** All of it is `buildspec.yml` — twelve lines,
in your repository. Four commands: read two outputs, inject the API URL, sync the
folder. Nothing hidden.

## 3. Deploy the pipeline

```bash
aws cloudformation deploy \
  --template-file pipeline/pipeline.yaml \
  --stack-name kuok-todo-dev-cicd \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides GitHubRepositoryId=<your-github-username>/three-tier-app
```

Then read the outputs — `ConnectionStatus` will say **`PENDING`**. That is
expected, and step 4 fixes it.

```bash
aws cloudformation describe-stacks --stack-name kuok-todo-dev-cicd \
  --query "Stacks[0].Outputs" --output table
```

## 4. Authorise the connection

A connection created by CloudFormation is always `PENDING` — AWS cannot grant
itself access to your GitHub account, so a human must approve it. This is the one
manual step in the lab, and it is a security feature.

1. AWS console, same region as your stacks.
2. **Developer Tools → Settings → Connections**.
3. Select **kuok-todo-dev-github** → **Update pending connection**.
4. Authorise the **AWS Connector for GitHub** app.

It must then read `AVAILABLE`:

```bash
aws codeconnections list-connections \
  --query "Connections[?ConnectionName=='kuok-todo-dev-github'].[ConnectionName,ConnectionStatus]" \
  --output table
```

> If it says `AVAILABLE` but the pipeline still fails with `No Branch [main]
> found`, the app was authorised but never **installed** — see
> [Troubleshooting](troubleshooting.md), item 2.

## 5. Run it

Creating a pipeline starts it once automatically, and that first run almost
certainly **failed**, because the connection was still `PENDING`. That is normal.
Now run it again:

```bash
aws codepipeline start-pipeline-execution --name kuok-todo-dev-pipeline
```

Watch it in **Developer Tools → CodePipeline**, or poll until both stages say
`Succeeded`:

```bash
aws codepipeline get-pipeline-state --name kuok-todo-dev-pipeline \
  --query "stageStates[].{Stage:stageName,Status:latestExecution.status}" --output table
```

## 6. Prove the pipeline really publishes the site

The site already worked, so how do you know the pipeline did anything? Delete the
files and let it put them back:

```bash
aws s3 rm "s3://$BUCKET" --recursive
```

Refresh the site — broken, as expected. Your DynamoDB records are untouched; only
Tier 1 is gone. Now:

```bash
aws codepipeline start-pipeline-execution --name kuok-todo-dev-pipeline
```

Wait for it, refresh again. The site is back, rebuilt from the code in GitHub
with the API URL injected automatically. Nobody needs to run `sed` or
`aws s3 sync` by hand again.

## Checkpoint

- [ ] Stack `kuok-todo-dev-cicd` created, connection `AVAILABLE`
- [ ] An execution shows `Succeeded` on both stages
- [ ] After emptying the bucket, the pipeline restored the site

## What just happened

You replaced Module 1's three manual steps with two pipeline stages. The pipeline
is now the only thing that publishes this application, and what it publishes is
whatever is on `main`.

Hold on to that: **`main` is now the deployed state of the system.** Which raises
the obvious question — who gets to change `main`, and how?

**Next:** [Module 3 — The developer loop](module-3-developer-loop.md)
