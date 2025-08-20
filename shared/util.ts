import { marshall } from "@aws-sdk/util-dynamodb";
import { CaseStudy, CaseStudyInstitution } from "./types";

type Entity = CaseStudy | CaseStudyInstitution;

export const generateItem = (entity: Entity) => {
  return {
    PutRequest: {
      Item: marshall(entity),
    },
  };
};

export const generateBatch = (data: Entity[]) => {
  return data.map((e) => {
    return generateItem(e);
  });
};