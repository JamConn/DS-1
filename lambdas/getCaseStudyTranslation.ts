import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { TranslateClient, TranslateTextCommand } from "@aws-sdk/client-translate";

const ddbDocClient = createDDbDocClient();
const translateClient = createTranslateClient();

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    console.log("[EVENT]", JSON.stringify(event));

    const idStr = event.pathParameters?.caseStudyId;
    if (!idStr) return response(400, { message: "Missing path parameter: caseStudyId" });

    const id = Number(idStr);
    if (Number.isNaN(id)) return response(400, { message: "caseStudyId must be a number" });

    const lang = event.queryStringParameters?.language;
    if (!lang) return response(400, { message: "Missing query parameter: language" });

    const getOut = await ddbDocClient.send(
      new GetCommand({ TableName: process.env.TABLE_NAME, Key: { id } })
    );

    if (!getOut.Item) return response(404, { message: `CaseStudy ${id} not found` });

    const textAttr = process.env.TEXT_ATTRIBUTE || "description";
    const textToTranslate = (getOut.Item as any)[textAttr];

    if (typeof textToTranslate !== "string" || !textToTranslate.length) {
      return response(500, { message: `Item does not contain a non-empty string '${textAttr}'` });
    }

    const cachedTranslation = (getOut.Item.translations?.[lang]?.[textAttr]) as string | undefined;

    let translatedText = cachedTranslation;

    if (!cachedTranslation) {
      const tr = await translateClient.send(
        new TranslateTextCommand({
          Text: textToTranslate,
          SourceLanguageCode: "auto",
          TargetLanguageCode: lang,
        })
      );

      translatedText = tr.TranslatedText;


    await ddbDocClient.send(new UpdateCommand({
       TableName: process.env.TABLE_NAME,
       Key: { id },
       UpdateExpression: "SET translations = if_not_exists(translations, :emptyMap)",
       ExpressionAttributeValues: { ":emptyMap": {} }
     }));


    await ddbDocClient.send(new UpdateCommand({
      TableName: process.env.TABLE_NAME,
      Key: { id },
      UpdateExpression: "SET translations.#lang = :translationObj",
      ExpressionAttributeNames: { "#lang": lang },
      ExpressionAttributeValues: {
         ":translationObj": {
        [textAttr]: translatedText,
        detectedSourceLanguage: tr.SourceLanguageCode
        }
      }
    }));
  }

    const payload = {
      ...getOut.Item,
      [`${textAttr}Translated`]: translatedText,
      translation: {
        targetLanguage: lang,
        detectedSourceLanguage: cachedTranslation ? getOut.Item.translations[lang].detectedSourceLanguage : undefined,
      },
    };

    return response(200, { data: payload });
  } catch (error: any) {
    console.log("[ERROR]", JSON.stringify(error));
    return response(500, { error });
  }
};

function createDDbDocClient() {
  const ddbClient = new DynamoDBClient({ region: process.env.REGION });
  const marshallOptions = { convertEmptyValues: true, removeUndefinedValues: true, convertClassInstanceToMap: true };
  const unmarshallOptions = { wrapNumbers: false };
  return DynamoDBDocumentClient.from(ddbClient, { marshallOptions, unmarshallOptions });
}

function createTranslateClient() {
  return new TranslateClient({ region: process.env.REGION });
}

function response(statusCode: number, body: unknown) {
  return { statusCode, headers: { "content-type": "application/json" }, body: JSON.stringify(body) };
}