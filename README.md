# typescript-dynamodb

example project using `typescript` + `serverless` framework + AWS `dynamodb`

## 0. create iam role for deployment

**create iam user first** : I created `GithubActionsUser-serverless`

Role path : `GithubActionsUser-serverless` => `public-api-ts-role-DeployerRole` => `public-api-ts-role-CloudformationExecutionRole`

```bash
cd aws/cloudformation/role
# you should prepare env.sh
./cloudformation.sh
```

## 1. prepare

```bash
npm ci
```

## 2. create custom domain

```bash
npx sls create_domain
```

## 3. deploy

```bash
npm run deploy-dev
```

## reference

- AWS IAM Role Setup
    -   https://serverlessfirst.com/create-iam-deployer-roles-serverless-app/
