# Deploy HelpMeHack on AWS Amplify

HelpMeHack is a full-stack Next.js SSR application and is configured to deploy directly from GitHub with AWS Amplify Hosting.

## What the repository already contains

- Next.js 15.5.25
- Node.js 22 via `.nvmrc`
- `next build` for SSR
- `amplify.yml` with `.next` as the deployment artifact
- server-side API routes under `app/api/*`
- hourly GitHub Actions refresh workflow

No Docker, ECR, ECS, EC2, or Application Load Balancer is required.

## Deploy

1. Open **AWS Amplify**.
2. Choose **Create new app**.
3. Choose **GitHub** as the repository provider.
4. Authorize AWS Amplify if prompted.
5. Select `rohanmalhotracodes/helpmehack`.
6. Select branch `aws-deployment`.
7. On the app settings page, let Amplify create and use a new service role.
8. Confirm the build settings are loaded from `amplify.yml`.
9. Choose **Save and deploy**.

Amplify should classify the application as a Next.js SSR / WEB_COMPUTE application.

## Optional environment variables

The application can start without credentials using its public GitHub fallback, but production indexing benefits from authenticated GitHub access and persistent Redis.

Configure only the values you use:

```text
GITHUB_APP_ID
GITHUB_APP_INSTALLATION_ID
GITHUB_APP_PRIVATE_KEY_BASE64
GITHUB_TOKEN
GITHUB_DISCOVERY_TOKEN

UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN

OPPORTUNITY_INDEX_TARGET=500
OPPORTUNITY_INDEX_BATCH_SIZE=20
OPPORTUNITY_INDEX_CONCURRENCY=4
OPPORTUNITY_INDEX_KEY=helpmehack:opportunity-index:v1

REFRESH_SECRET

NEWSLETTER_ENDPOINT
NEWSLETTER_API_TOKEN
```

After changing environment variables, redeploy the branch.

AWS documents that Next.js SSR runtime variables need to be written to a Next.js environment file during the Amplify build. The repository's `amplify.yml` does this for the variables above.

## Scheduled refresh

Once Amplify provides the live URL, add these GitHub Actions repository secrets:

```text
HELPMEHACK_URL=https://YOUR-BRANCH.YOUR-APP-ID.amplifyapp.com
REFRESH_SECRET=the-same-value-configured-in-Amplify
```

The existing `refresh-opportunities.yml` workflow will continue calling:

```text
POST /api/cron/refresh-opportunities
```

once per hour.

## Logs

For an SSR deployment, Amplify sends server runtime logs to Amazon CloudWatch. Use those logs to investigate GitHub API, Redis, newsletter, or route-handler errors.

## Custom domain

After the default Amplify URL works:

1. Open the HelpMeHack app in Amplify.
2. Go to **Hosting > Custom domains**.
3. Add your domain.
4. Follow the DNS validation instructions.

Amplify provisions HTTPS for the connected domain.
