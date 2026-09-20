# Deploy HelpMeHack on AWS

HelpMeHack is a full-stack Next.js application. Its frontend and `/api/*` route handlers run together, so the AWS deployment target is a container on Amazon ECS/Fargate rather than static S3 hosting.

## Architecture

- Amazon ECR stores the production Docker image.
- Amazon ECS on AWS Fargate runs the Next.js server.
- An Application Load Balancer or ECS Express Mode exposes HTTPS traffic.
- AWS Secrets Manager stores private server credentials.
- Amazon CloudWatch receives ECS application logs.
- Upstash Redis remains the durable opportunity-index store through its provider-neutral REST API.
- GitHub Actions keeps the hourly opportunity refresh and can deploy new images to ECS.

## 1. Prerequisites

Install Docker and the AWS CLI, then authenticate the CLI:

```bash
aws configure
aws sts get-caller-identity
```

Use one AWS region for ECR and ECS:

```bash
export AWS_REGION=ap-south-1
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export ECR_REPOSITORY=helpmehack
```

## 2. Build locally

Create a local `.env` from `.env.example`.

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build

docker build -t helpmehack .
docker run --rm -p 3000:3000 --env-file .env helpmehack
```

Verify:

```bash
curl -f http://localhost:3000/api/health
```

## 3. Create ECR and push the first image

```bash
aws ecr create-repository \
  --repository-name "$ECR_REPOSITORY" \
  --region "$AWS_REGION"

aws ecr get-login-password --region "$AWS_REGION" | \
docker login \
  --username AWS \
  --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

docker buildx build \
  --platform linux/amd64 \
  -t "$ECR_REPOSITORY:latest" \
  --load .

docker tag "$ECR_REPOSITORY:latest" \
  "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest"

docker push \
  "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest"
```

## 4. Store production secrets

Use AWS Secrets Manager for:

- `GITHUB_APP_PRIVATE_KEY_BASE64`
- `GITHUB_TOKEN` if used
- `GITHUB_DISCOVERY_TOKEN` if used
- `UPSTASH_REDIS_REST_TOKEN`
- `REFRESH_SECRET`
- `NEWSLETTER_API_TOKEN` if used

These can be normal ECS environment variables:

- `GITHUB_APP_ID`
- `GITHUB_APP_INSTALLATION_ID`
- `UPSTASH_REDIS_REST_URL`
- `OPPORTUNITY_INDEX_TARGET`
- `OPPORTUNITY_INDEX_BATCH_SIZE`
- `OPPORTUNITY_INDEX_CONCURRENCY`
- `OPPORTUNITY_INDEX_KEY`
- `NEWSLETTER_ENDPOINT`

Do not bake secrets into the Docker image or commit them to Git.

## 5. Create the ECS/Fargate service

Use ECS Express Mode if it is available in your account, or create a standard ECS/Fargate service behind an Application Load Balancer.

Configure:

- container port: `3000`
- health check path: `/api/health`
- desired tasks: `1` initially
- image: `$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/helpmehack:latest`
- CloudWatch logging: enabled
- HTTPS endpoint: enabled

Inject the environment variables and Secrets Manager values from the previous section into the task.

## 6. Hourly opportunity refresh

The existing `.github/workflows/refresh-opportunities.yml` workflow remains platform-independent.

After AWS is live, set these GitHub repository secrets:

```text
HELPMEHACK_URL=https://your-aws-hostname
REFRESH_SECRET=the-same-value-used-by-the-ecs-task
```

## 7. Automatic deployments

The included `.github/workflows/deploy-aws.yml` workflow builds and pushes a Docker image and forces a new ECS deployment after each push to `main`.

Configure GitHub repository variables:

```text
AWS_REGION=ap-south-1
ECR_REPOSITORY=helpmehack
ECS_CLUSTER=your-cluster-name
ECS_SERVICE=your-service-name
```

Configure this GitHub repository secret:

```text
AWS_ROLE_ARN=arn:aws:iam::<account-id>:role/<github-actions-role>
```

Use GitHub Actions OIDC for the IAM role. Grant it only the ECR push permissions for this repository and the ECS permissions required to describe and update this service.

The ECS task definition should reference the ECR image using the `:latest` tag. The workflow also publishes an immutable commit-SHA tag for traceability.

## 8. Domain

After the AWS endpoint is verified, point your domain to the AWS load balancer/Express Mode endpoint and use AWS Certificate Manager for HTTPS.

## Production smoke tests

```bash
curl -f https://YOUR_AWS_HOST/api/health
curl -f https://YOUR_AWS_HOST/api/opportunities
```

Then manually trigger the `Refresh open-source opportunities` workflow once and confirm it succeeds.
