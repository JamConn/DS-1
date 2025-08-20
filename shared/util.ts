import { marshall } from "@aws-sdk/util-dynamodb";
import { CaseStudy } from "./types";


export const generateCaseStudyItem = (caseStudy: CaseStudy) => {
  return {
    PutRequest: {
      Item: marshall(caseStudy),
    },
  };
};


export const generateCaseStudyBatch = (data: CaseStudy[]) => {
  return data.map((e) => generateCaseStudyItem(e));
};
