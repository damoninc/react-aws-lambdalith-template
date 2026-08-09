# React + AWS Lambdalith Monorepo Template

A deliberately small full-stack starter:

- `apps/web` — React + Vite + TypeScript
- `apps/api` — one TypeScript Lambda with an internal router
- `packages/shared` — shared request/response types
- `infra` — AWS CDK
- API Gateway HTTP API `$default` route → one Lambda
- CloudFront serves React and forwards `/api/*` to API Gateway
- S3 privately hosts the built frontend

## Requirements

- Node.js 24+
- npm
- AWS CLI credentials configured
- AWS CDK bootstrap completed for the target account/region

## Start locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

Vite proxies `/api/*` to the local API server on port `3001`, so the frontend uses the same URLs locally and in AWS.

Try:

```bash
curl http://localhost:3001/api/health
curl http://localhost:3001/api/hello
```

## Build

```bash
npm run build
```

## First AWS deployment

Bootstrap each AWS account/region once:

```bash
npm run bootstrap
```

Then deploy from the repo root:

```bash
npm run deploy
```

CDK prints both the CloudFront site URL and raw API Gateway URL.

## Add an API route

Add a branch to `apps/api/src/router.ts`:

```ts
if (request.method === 'POST' && request.path === '/api/products') {
  return {
    statusCode: 201,
    body: { id: 'example-product' },
  };
}
```

Everything under `/api/*` reaches the same Lambda. As the app grows, split route handlers into files such as:

```text
apps/api/src/
├── handler.ts
├── router.ts
└── routes/
    ├── products.ts
    ├── users.ts
    └── config.ts
```

## Turn this into your GitHub template

```bash
git init
git add .
git commit -m "Initial React + lambdalith template"
git branch -M main
gh repo create react-aws-lambdalith-template --private --source=. --push
```

Then in GitHub, enable **Template repository** for the repo. New projects can be created from it without copying the history.

## Suggested evolution

Keep the template small until a project proves it needs more. Common additions are:

- DynamoDB repositories under `apps/api/src/repositories/`
- dependency injection / service container under `apps/api/src/services/`
- Cognito or another auth provider
- custom Route 53 domain + ACM certificate on CloudFront
- environment-specific CDK stacks (`dev`, `staging`, `prod`)
- Vitest for web/shared tests
- Jest or Vitest for API unit tests
