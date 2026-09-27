# Module 1 — Deploy the Infrastructure

**Duration:** 45 minutes · **Before you start:** [Module 0](00-prerequisites.md)

You will deploy all three tiers with one command, then publish the website **by
hand**. The manual part is deliberate — Module 2 replaces it with a pipeline, and
the contrast is the point.

## 1. Look at the template first

Open `infrastructure/application-infrastructure.yaml`. It is organised in three
labelled sections matching the three tiers: DynamoDB, then the two Lambdas and
the HTTP API, then the S3 website.

Three things worth pausing on:

- **The Lambda code is inside the template**, under `Code: ZipFile`. There is no
  build step because there is nothing to build.
- **Each function has its own role with one DynamoDB action** — `PutItem` for
  add-record, `Scan` for get-records. Neither can do the other's job.
- **`CorsConfiguration` on the API.** The browser loads the page from the S3
  address and calls the API on a *different* address. Without CORS the browser
  refuses. This is the most common reason a three-tier app works in the console
  but not in a browser.

## 2. Deploy

```bash
aws cloudformation deploy \
  --template-file infrastructure/application-infrastructure.yaml \
  --stack-name kuok-todo-dev-app \
  --capabilities CAPABILITY_NAMED_IAM
```

Expect `Successfully created/updated stack` after two to three minutes.

**Why `--capabilities CAPABILITY_NAMED_IAM`?** The template creates IAM roles
with names you chose, and CloudFormation will not do that unless you say so
explicitly — a guard rail, because IAM changes are how privilege escalation
happens.

If it fails, don't re-run blindly: see [Troubleshooting](troubleshooting.md),
especially `ROLLBACK_COMPLETE`.

## 3. Read the Outputs

```bash
aws cloudformation describe-stacks --stack-name kuok-todo-dev-app \
  --query "Stacks[0].Outputs" --output table
```

Four rows: `FrontendURL`, `FrontendBucketName`, `ApiEndpoint`, `TableName`.

Outputs are not decoration — in Module 2 the pipeline reads two of them to know
where to publish and which API URL to bake into the page.

Save the two you need next:

```bash
BUCKET=$(aws cloudformation describe-stacks --stack-name kuok-todo-dev-app \
  --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" --output text)
API=$(aws cloudformation describe-stacks --stack-name kuok-todo-dev-app \
  --query "Stacks[0].Outputs[?OutputKey=='ApiEndpoint'].OutputValue" --output text)
echo "$BUCKET"; echo "$API"
```

Both must print a value.

## 4. Test the API before there is any website

Prove the backend works on its own, so if the page misbehaves later you know
which tier to suspect.

```bash
curl -s -X POST "$API/records" -H "Content-Type: application/json" \
  -d '{"title":"Check the API works"}'      # expect 201 and the saved record

curl -s "$API/records"                       # expect {"records": [ ... ]}

curl -s -X POST "$API/records" -H "Content-Type: application/json" -d '{}'
# expect {"message": "The field 'title' is required."} - validation, not a crash
```

## 5. Publish the website by hand

The bucket exists but is empty, and the page needs the API address baked in — a
static file has no other way to learn it. This writes to a temp folder, so your
git working tree stays clean:

```bash
mkdir -p /tmp/publish
cp frontend/index.html frontend/style.css /tmp/publish/
sed "s|__API_BASE_URL__|$API|g" frontend/app.js > /tmp/publish/app.js
head -5 /tmp/publish/app.js       # the API_BASE_URL line must show a real https:// URL
aws s3 sync /tmp/publish/ "s3://$BUCKET/" --delete
```

## 6. Use it

```bash
aws cloudformation describe-stacks --stack-name kuok-todo-dev-app \
  --query "Stacks[0].Outputs[?OutputKey=='FrontendURL'].OutputValue" --output text
```

Open that URL. You should see the heading **"Welcome to Three Tier
Application"**, the task you created with `curl`, and a form. Add one and watch
it appear.

## Checkpoint

- [ ] Stack is `CREATE_COMPLETE` with four Outputs
- [ ] `curl` can create and list records
- [ ] The website loads and a task added in the browser appears in the list

## What just happened

One command created 17 resources. Then **three manual steps** got the site live:
read the outputs, inject the API URL, upload the files.

Count the ways that goes wrong at scale — you forget the `sed`, you upload to the
wrong bucket, you publish code nobody reviewed, or a colleague publishes
something different an hour later and nobody can say what is deployed. That is
the problem CI/CD solves. Not typing speed.

**Next:** [Module 2 — Create the pipeline](module-2-create-pipeline.md)
