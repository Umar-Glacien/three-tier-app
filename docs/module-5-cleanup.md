# Module 5 — Clean Up

**Duration:** 15 minutes

Everything you built lives in two CloudFormation stacks. Delete them in the order below
and nothing is left behind. Every command assumes `AWS_PROFILE` and `AWS_REGION` are
exported; replace `<AWS_ACCOUNT_ID>` with your account ID.

**Why this order.** The application stack was created using a role that lives in the
pipeline stack. Delete the pipeline stack first and that role disappears, stranding the
application stack.

---

## 1. Empty both S3 buckets

CloudFormation will not delete a bucket that still contains objects, so a non-empty
bucket makes the stack deletion fail.

```bash
aws s3 rm "s3://kuok-todo-dev-site-<AWS_ACCOUNT_ID>" --recursive
aws s3 rm "s3://kuok-todo-dev-artifacts-<AWS_ACCOUNT_ID>" --recursive
```

## 2. Delete the application stack

```bash
aws cloudformation delete-stack --stack-name kuok-todo-dev-app
aws cloudformation wait stack-delete-complete --stack-name kuok-todo-dev-app
```

The waiter returns silently after a minute or two. Silence means success.

## 3. Delete the pipeline stack

```bash
aws cloudformation delete-stack --stack-name kuok-todo-dev-cicd
aws cloudformation wait stack-delete-complete --stack-name kuok-todo-dev-cicd
```

## 4. The GitHub connection

`kuok-todo-dev-github` is a resource of the pipeline stack, so step 3 removed it. There
is nothing separate to do — step 5 confirms it.

## 5. Verify nothing is left

Run all five checks. Empty output means clean.

```bash
aws cloudformation list-stacks \
  --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE UPDATE_ROLLBACK_COMPLETE ROLLBACK_COMPLETE DELETE_FAILED \
  --query "StackSummaries[?starts_with(StackName, 'kuok-todo')].[StackName,StackStatus]" \
  --output table

aws s3 ls | grep kuok-todo

aws dynamodb list-tables \
  --query "TableNames[?starts_with(@, 'kuok-todo')]" --output table

aws logs describe-log-groups --log-group-name-prefix /aws/lambda/kuok-todo \
  --query "logGroups[].logGroupName" --output table
aws logs describe-log-groups --log-group-name-prefix /aws/codebuild/kuok-todo \
  --query "logGroups[].logGroupName" --output table

aws codeconnections list-connections \
  --query "Connections[?ConnectionName=='kuok-todo-dev-github'].ConnectionName" \
  --output table
```

Your GitHub repository is not an AWS resource — it costs nothing and can stay.

---

## Checklist

- [ ] Both buckets emptied
- [ ] `kuok-todo-dev-app` deleted
- [ ] `kuok-todo-dev-cicd` deleted
- [ ] No `kuok-todo` stacks, buckets, tables or log groups listed
- [ ] Connection `kuok-todo-dev-github` no longer listed

If something did not behave as described, see [Troubleshooting](troubleshooting.md).
