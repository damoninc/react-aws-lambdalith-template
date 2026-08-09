import * as path from "node:path";
import { CfnOutput, Duration, Fn, Stack, type StackProps } from "aws-cdk-lib";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import {
  AllowedMethods,
  CachePolicy,
  Distribution,
  OriginRequestPolicy,
  ViewerProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { HttpApi } from "aws-cdk-lib/aws-apigatewayv2";
import { HttpOrigin, S3BucketOrigin } from "aws-cdk-lib/aws-cloudfront-origins";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { Bucket } from "aws-cdk-lib/aws-s3";

interface AppStackProps extends StackProps {
  webBucket: Bucket;
}

export class AppStack extends Stack {
  constructor(scope: Construct, id: string, props: AppStackProps) {
    super(scope, id, props);

    const apiFunction = new NodejsFunction(this, "ApiFunction", {
      entry: path.join(__dirname, "../../apps/api/src/handler.ts"),
      handler: "handler",
      runtime: Runtime.NODEJS_24_X,
      memorySize: 512,
      timeout: Duration.seconds(15),
      bundling: {
        minify: true,
        sourceMap: true,
      },
    });

    const api = new HttpApi(this, "HttpApi", {
      defaultIntegration: new HttpLambdaIntegration(
        "ApiIntegration",
        apiFunction,
      ),
    });

    const distribution = new Distribution(this, "Distribution", {
      defaultRootObject: "index.html",
      defaultBehavior: {
        origin: S3BucketOrigin.withOriginAccessControl(props.webBucket),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
        },
      ],
    });

    const apiDomain = Fn.select(2, Fn.split("/", api.apiEndpoint));

    distribution.addBehavior("/api/*", new HttpOrigin(apiDomain), {
      allowedMethods: AllowedMethods.ALLOW_ALL,
      cachePolicy: CachePolicy.CACHING_DISABLED,
      originRequestPolicy: OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
      viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    });

    new BucketDeployment(this, "DeployWeb", {
      destinationBucket: props.webBucket,
      sources: [Source.asset(path.join(__dirname, "../../apps/web/dist"))],
      distribution,
      distributionPaths: ["/*"],
    });

    new CfnOutput(this, "SiteUrl", {
      value: `https://${distribution.distributionDomainName}`,
    });

    new CfnOutput(this, "ApiUrl", {
      value: api.apiEndpoint,
    });
  }
}
