# Quick Reference

One page. Keep it open beside the module you are on.

## Every terminal needs this first

```bash
export AWS_PROFILE=<your-profile>
export AWS_REGION=<your-region>
aws sts get-caller-identity          # must show your training account
```

## Names you will type

| Thing | Name |
|---|---|
| Application stack | `kuok-todo-dev-app` |
| Pipeline stack | `kuok-todo-dev-cicd` |
| Pipeline | `kuok-todo-dev-pipeline` |
| DynamoDB table | `kuok-todo-dev-records` |
| Website bucket | `kuok-todo-dev-site-<your-account-id>` |

## Reading the stack outputs

```bash
aws cloudformation describe-stacks --stack-name kuok-todo-dev-app \
  --query "Stacks[0].Outputs" --output table

# into variables, for the commands below
BUCKET=$(aws cloudformation describe-stacks --stack-name kuok-todo-dev-app \
  --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" --output text)
API=$(aws cloudformation describe-stacks --stack-name kuok-todo-dev-app \
  --query "Stacks[0].Outputs[?OutputKey=='ApiEndpoint'].OutputValue" --output text)
```

## Module 1 — deploy and publish by hand

```bash
aws cloudformation deploy \
  --template-file infrastructure/application-infrastructure.yaml \
  --stack-name kuok-todo-dev-app --capabilities CAPABILITY_NAMED_IAM

curl -s -X POST "$API/records" -H "Content-Type: application/json" -d '{"title":"test"}'
curl -s "$API/records"

mkdir -p /tmp/publish
cp frontend/index.html frontend/style.css /tmp/publish/
sed "s|__API_BASE_URL__|$API|g" frontend/app.js > /tmp/publish/app.js
aws s3 sync /tmp/publish/ "s3://$BUCKET/" --delete
```

## Module 2 — the pipeline

```bash
aws cloudformation deploy \
  --template-file pipeline/pipeline.yaml \
  --stack-name kuok-todo-dev-cicd --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides GitHubRepositoryId=<your-github-username>/three-tier-app

aws codeconnections list-connections \
  --query "Connections[?ConnectionName=='kuok-todo-dev-github'].[ConnectionName,ConnectionStatus]" \
  --output table                                    # must read AVAILABLE

aws codepipeline start-pipeline-execution --name kuok-todo-dev-pipeline
```

## Modules 3 and 4 — the loop

```bash
git switch main && git pull
git switch -c feature/<name>
#   ...edit files...
git diff
git add <files> && git commit -m "<message>"
git push -u origin feature/<name>
#   ...open the pull request on GitHub, review the diff, merge...
git switch main && git pull && git branch -d feature/<name>
```

## Checking the pipeline

Note the flags differ — `--name` for two of these, `--pipeline-name` for the third.

```bash
aws codepipeline get-pipeline-state --name kuok-todo-dev-pipeline \
  --query "stageStates[].{Stage:stageName,Status:latestExecution.status}" --output table

aws codepipeline list-pipeline-executions --pipeline-name kuok-todo-dev-pipeline \
  --max-items 5 \
  --query "pipelineExecutionSummaries[].{Started:startTime,Status:status,Trigger:trigger.triggerType}" \
  --output table
```

## Module 5 — clean up

```bash
aws s3 rm "s3://$BUCKET" --recursive
aws s3 rm "s3://kuok-todo-dev-artifacts-$(aws sts get-caller-identity --query Account --output text)" --recursive
aws cloudformation delete-stack --stack-name kuok-todo-dev-app
aws cloudformation wait stack-delete-complete --stack-name kuok-todo-dev-app
aws cloudformation delete-stack --stack-name kuok-todo-dev-cicd
aws cloudformation wait stack-delete-complete --stack-name kuok-todo-dev-cicd
```

## When something breaks

Hard refresh is `Cmd+Shift+R` / `Ctrl+F5`. Everything else:
[Troubleshooting](troubleshooting.md).
