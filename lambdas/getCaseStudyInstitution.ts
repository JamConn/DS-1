import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  QueryCommandInput,
} from "@aws-sdk/lib-dynamodb";
import Ajv from "ajv";
import schema from "../shared/types.schema.json";
import { CaseStudyInstitutionQueryParams } from "../shared/types";

const ajv = new Ajv();
const isValidQueryParams = ajv.compile(

  (schema as any).definitions["CaseStudyInstitutionQueryParams"] || {}
);

const ddbDocClient = createDocumentClient();

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    console.log("[EVENT]", JSON.stringify(event));
    const queryParams = event.queryStringParameters as
      | CaseStudyInstitutionQueryParams
      | undefined;

    if (!queryParams) {
      return {
        statusCode: 500,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: "Missing query parameters" }),
      };
    }

    if (!isValidQueryParams(queryParams)) {
      return {
        statusCode: 500,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message: `Incorrect type. Must match Query parameters schema`,
          schema: (schema as any).definitions["CaseStudyInstitutionQueryParams"],
        }),
      };
    }

    const caseStudyId = parseInt(queryParams.caseStudyId, 10);
    let commandInput: QueryCommandInput = {
      TableName: process.env.TABLE_NAME,
    };


    if ("location" in queryParams && queryParams.location) {
      commandInput = {
        ...commandInput,
        IndexName: "locationIx",
        KeyConditionExpression:
          "caseStudyId = :c and begins_with(location, :l)",
        ExpressionAttributeValues: {
          ":c": caseStudyId,
          ":l": queryParams.location,
        },
      };
    } else if (
      "institutionName" in queryParams &&
      queryParams.institutionName
    ) {
      commandInput = {
        ...commandInput,
        KeyConditionExpression:
          "caseStudyId = :c and begins_with(institutionName, :n)",
        ExpressionAttributeValues: {
          ":c": caseStudyId,
          ":n": queryParams.institutionName,
        },
      };
    } else {
      commandInput = {
        ...commandInput,
        KeyConditionExpression: "caseStudyId = :c",
        ExpressionAttributeValues: {
          ":c": caseStudyId,
        },
      };
    }

    const commandOutput = await ddbDocClient.send(
      new QueryCommand(commandInput)
    );

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ data: commandOutput.Items }),
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

function createDocumentClient() {
  const ddbClient = new DynamoDBClient({ region: process.env.REGION });
  const marshallOptions = {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  };
  const unmarshallOptions = { wrapNumbers: false };
  const translateConfig = { marshallOptions, unmarshallOptions };
  return DynamoDBDocumentClient.from(ddbClient, translateConfig);
}