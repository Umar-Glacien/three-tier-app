# Module 0 — Prerequisites

**Duration:** 10 minutes

Most of this should already be done. Confirm it, then move on.

## What you need

| Requirement | Check with | If missing |
|---|---|---|
| AWS account (your own, for this lab) | Your trainer provides it | Ask your trainer |
| AWS CLI v2 | `aws --version` | [Install it](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) |
| Git | `git --version` | [Install it](https://git-scm.com/downloads) |
| GitHub account | Sign in at github.com | Create a free one |

No Python, Node.js, Docker or IDE needed. All the code runs in AWS.

> **Windows:** use **Git Bash** or **WSL**, not native PowerShell. The lab uses
> `/tmp` paths and `sed`.

## 1. Point your shell at the right account

Set these two. Every command in every module assumes they are set, so set them
again in any new terminal.

```bash
export AWS_PROFILE=<your-profile>
export AWS_REGION=<your-region>
aws sts get-caller-identity
```

That must print an account number — **check it matches the one your trainer gave
you.** On `ExpiredToken` or a credentials error, sign in again
(`aws sso login --profile <your-profile>` for IAM Identity Center).

## 2. Confirm the GitHub App is installed

Open <https://github.com/settings/installations> — the **Installed** GitHub Apps
tab. **AWS Connector for GitHub** must be listed. If the page is empty, install
it at <https://github.com/apps/aws-connector-for-github/installations/new>,
choose your account, choose **All repositories**, and click **Install**.

> Authorising an app and installing it are different things, and AWS reports the
> connection as healthy after only the first. If it is not installed, Module 2
> fails with `No Branch [main] found` even though your branch exists. Two
> minutes here saves twenty later.

## 3. Get the lab code

Create your own repository from the template (**Use this template → Create a new
repository**, named `three-tier-app`), then:

```bash
git clone https://github.com/<your-github-username>/three-tier-app.git
cd three-tier-app
```

## Checkpoint

- [ ] `aws sts get-caller-identity` returns your training account
- [ ] `aws --version` reports 2.x
- [ ] **AWS Connector for GitHub** appears under *Installed* GitHub Apps
- [ ] You have your own `three-tier-app` repository, cloned

**Next:** [Module 1 — Deploy the infrastructure](module-1-deploy-infrastructure.md)
