export interface CaseStudy {
  id: number;
  version: string;
  title: string;
  author: string;
  year: number;
  description: string;
  isPublished: boolean;
}


export type CaseStudyInstitution = {
  caseStudyId: number;
  institutionName: string;
  location: string;
  description: string;
};

export type CaseStudyInstitutionQueryParams = {
  caseStudyId: string;
  institutionName?: string;
  location?: string;
};