#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { AppStack } from "../lib/app-stack";
import { DataStack } from "../lib/data-stack";

const app = new cdk.App();
const projectName = "Placeholder";

const datastack = new DataStack(app, `${projectName}DataStack`);

new AppStack(app, `${projectName}AppStack`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: "us-east-1",
  },
  webBucket: datastack.webBucket,
});
