import * as cdk from "aws-cdk-lib";
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as custom from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";
import { generateCaseStudyBatch } from "../shared/util";
import { caseStudies } from "../seed/case-studies";
import * as apig from "aws-cdk-lib/aws-apigateway";

export class RestAPIStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB Table for CaseStudies
    const caseStudiesTable = new dynamodb.Table(this, "CaseStudiesTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "id", type: dynamodb.AttributeType.NUMBER },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "CaseStudies",
    });

    // Lambda functions
    const getCaseStudyByIdFn = new lambdanode.NodejsFunction(this, "GetCaseStudyByIdFn", {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: `${__dirname}/../lambdas/getCaseStudyById.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: caseStudiesTable.tableName,
        REGION: "eu-west-1",
      },
    });

    const getAllCaseStudiesFn = new lambdanode.NodejsFunction(this, "GetAllCaseStudiesFn", {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: `${__dirname}/../lambdas/getAllCaseStudies.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: caseStudiesTable.tableName,
        REGION: "eu-west-1",
      },
    });

    const newCaseStudyFn = new lambdanode.NodejsFunction(this, "AddCaseStudyFn", {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: `${__dirname}/../lambdas/addCaseStudy.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: caseStudiesTable.tableName,
        REGION: "eu-west-1",
      },
    });

    // seeding logic added
    new custom.AwsCustomResource(this, "CaseStudiesDdbInitData", {
      onCreate: {
        service: "DynamoDB",
        action: "batchWriteItem",
        parameters: {
          RequestItems: {
            [caseStudiesTable.tableName]: generateCaseStudyBatch(caseStudies),
          },
        },
        physicalResourceId: custom.PhysicalResourceId.of("CaseStudiesDdbInitData"),
      },
      policy: custom.AwsCustomResourcePolicy.fromSdkCalls({
        resources: [caseStudiesTable.tableArn],
      }),
    });

    // permissions
    caseStudiesTable.grantReadData(getCaseStudyByIdFn);
    caseStudiesTable.grantReadData(getAllCaseStudiesFn);
    caseStudiesTable.grantReadWriteData(newCaseStudyFn);

    // API
    const api = new apig.RestApi(this, "CaseStudiesApi", {
      restApiName: "Case Studies Service",
      deployOptions: {
        stageName: "dev",
      },
      defaultCorsPreflightOptions: {
        allowHeaders: ["Content-Type", "X-Amz-Date"],
        allowMethods: ["OPTIONS", "GET", "POST", "PUT", "PATCH", "DELETE"],
        allowCredentials: true,
        allowOrigins: ["*"],
      },
    });

    // endpoints
    const caseStudiesEndpoint = api.root.addResource("case-studies");
    caseStudiesEndpoint.addMethod(
      "GET",
      new apig.LambdaIntegration(getAllCaseStudiesFn, { proxy: true })
    );

const caseStudyItem = caseStudiesEndpoint.addResource("item");  // added this extra level due to error with endpoint routing
const specificCaseStudyEndpoint = caseStudyItem.addResource("{caseStudyId}");
specificCaseStudyEndpoint.addMethod(
  "GET",
  new apig.LambdaIntegration(getCaseStudyByIdFn, { proxy: true })
);

    caseStudiesEndpoint.addMethod(
      "POST",
      new apig.LambdaIntegration(newCaseStudyFn, { proxy: true })
    );
  }
}