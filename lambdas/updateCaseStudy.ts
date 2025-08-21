import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import Ajv from "ajv";
import schema from "../shared/types.schema.json"; 
import { CaseStudy } from "../shared/types";

const ajv = new Ajv();
const isValidBodyParams = ajv.compile(schema.definitions["CaseStudy"] || {});

const ddbDocClient = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    console.log("[EVENT]", JSON.stringify(event));


    const pathParameters = event?.pathParameters;
    const caseStudyId = pathParameters?.caseStudyId
      ? parseInt(pathParameters.caseStudyId, 10)
      : undefined;

    if (!caseStudyId && caseStudyId !== 0) {
      return {
        statusCode: 404,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: "Missing case study Id" }),
      };
    }

    const body: CaseStudy | undefined = event.body ? JSON.parse(event.body) : undefined;
    if (!body) {
      return {
        statusCode: 500,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: "Missing request body" }),
      };
    }


    if (!isValidBodyParams(body)) {
      return {
        statusCode: 400,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message: "Incorrect type. Must match the CaseStudy schema",
          errors: isValidBodyParams.errors,
          schema: schema.definitions["CaseStudy"],
        }),
      };
    }


    if (body.id !== caseStudyId) {
      return {
        statusCode: 400,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message: "Path caseStudyId does not match body.id",
          pathCaseStudyId: caseStudyId,
          bodyId: body.id,
        }),
      };
    }

    await ddbDocClient.send(
      new PutCommand({
        TableName: process.env.TABLE_NAME,
        Item: body,
      })
    );

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "Case study updated" }),
    };
  } catch (error: any) {
    console.log(JSON.stringify(error));
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ error }),
    };
  }
};

function createDDbDocClient() {
  const ddbClient = new DynamoDBClient({ region: process.env.REGION });
  const marshallOptions = {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  };
  const unmarshallOptions = {
    wrapNumbers: false,
  };
  const translateConfig = { marshallOptions, unmarshallOptions };
  return DynamoDBDocumentClient.from(ddbClient, translateConfig);
}