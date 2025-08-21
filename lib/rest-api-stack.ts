import * as cdk from "aws-cdk-lib";
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as custom from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";
import { generateBatch } from "../shared/util";
import { caseStudies, institutions } from "../seed/case-studies";
import * as apig from "aws-cdk-lib/aws-apigateway";
import * as iam from "aws-cdk-lib/aws-iam";

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

    const institutionsTable = new dynamodb.Table(this, "InstitutionsTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "caseStudyId", type: dynamodb.AttributeType.NUMBER },
      sortKey: { name: "institutionName", type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "CaseStudyInstitutions",
    });

    institutionsTable.addLocalSecondaryIndex({
      indexName: "locationIx",
      sortKey: { name: "location", type: dynamodb.AttributeType.STRING },
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


    const updateCaseStudyFn = new lambdanode.NodejsFunction(this, "UpdateCaseStudyFn", {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: `${__dirname}/../lambdas/updateCaseStudy.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: caseStudiesTable.tableName,
        REGION: "eu-west-1",
      },
    });

    const getCaseStudyInstitutionFn = new lambdanode.NodejsFunction(
      this,
      "GetCaseStudyInstitutionFn",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: `${__dirname}/../lambdas/getCaseStudyInstitution.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: institutionsTable.tableName,
          REGION: "eu-west-1",
        },
      }
    );

    const getCaseStudyTranslationFn = new lambdanode.NodejsFunction(
     this,
      "GetCaseStudyTranslationFn",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: `${__dirname}/../lambdas/getCaseStudyTranslation.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: caseStudiesTable.tableName,
          REGION: "eu-west-1",
        TEXT_ATTRIBUTE: "description", 
        },
      }
    );

    // Seed
    new custom.AwsCustomResource(this, "CaseStudiesDdbInitData", {
      onCreate: {
        service: "DynamoDB",
        action: "batchWriteItem",
        parameters: {
          RequestItems: {
            [caseStudiesTable.tableName]: generateBatch(caseStudies),
            [institutionsTable.tableName]: generateBatch(institutions),
          },
        },
        physicalResourceId: custom.PhysicalResourceId.of("CaseStudiesDdbInitData"),
      },
      policy: custom.AwsCustomResourcePolicy.fromSdkCalls({
        resources: [caseStudiesTable.tableArn, institutionsTable.tableArn],
      }),
    });

    // permissions
    caseStudiesTable.grantReadData(getCaseStudyByIdFn);
    caseStudiesTable.grantReadData(getAllCaseStudiesFn);
    caseStudiesTable.grantReadWriteData(newCaseStudyFn);
    caseStudiesTable.grantReadWriteData(updateCaseStudyFn);
    institutionsTable.grantReadData(getCaseStudyInstitutionFn);
    caseStudiesTable.grantReadData(getCaseStudyTranslationFn);

    // REST API
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

    getCaseStudyTranslationFn.addToRolePolicy(
      new iam.PolicyStatement({
      actions: ["translate:TranslateText", "comprehend:DetectDominantLanguage"],
      resources: ["*"],
     })
    );

    // endpoints
    const caseStudiesEndpoint = api.root.addResource("case-studies");
    caseStudiesEndpoint.addMethod(
      "GET",
      new apig.LambdaIntegration(getAllCaseStudiesFn, { proxy: true })
    );

    const caseStudyItem = caseStudiesEndpoint.addResource("item");
    const specificCaseStudyEndpoint = caseStudyItem.addResource("{caseStudyId}");
    specificCaseStudyEndpoint.addMethod(
      "GET",
      new apig.LambdaIntegration(getCaseStudyByIdFn, { proxy: true })
    );

    specificCaseStudyEndpoint.addMethod(
      "PUT",
      new apig.LambdaIntegration(updateCaseStudyFn, { proxy: true })
    );

    caseStudiesEndpoint.addMethod(
      "POST",
      new apig.LambdaIntegration(newCaseStudyFn, { proxy: true })
    );

    const institutionsEndpoint = caseStudiesEndpoint.addResource("institutions");
    institutionsEndpoint.addMethod(
      "GET",
      new apig.LambdaIntegration(getCaseStudyInstitutionFn, { proxy: true })
    );

    const translationEndpoint = specificCaseStudyEndpoint.addResource("translation");
    translationEndpoint.addMethod(
      "GET",
     new apig.LambdaIntegration(getCaseStudyTranslationFn, { proxy: true })
    );
 
  }
}