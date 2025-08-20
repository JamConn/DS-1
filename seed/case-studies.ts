import { CaseStudy, CaseStudyInstitution } from '../shared/types'

export const caseStudies : CaseStudy[] = [
  { id: 1, version: "1", title: "AI in Healthcare", author: "Dr. Jane Smith", year: 2023, description: "Explores artificial intelligence in diagnostics and hospital management.", isPublished: true },
  { id: 2, version: "1", title: "Sustainable Agriculture", author: "Prof. Liam O’Connor", year: 2024, description: "Investigates sustainable farming practices addressing food security challenges.", isPublished: false },
  { id: 3, version: "1", title: "Blockchain in Supply Chains", author: "Sarah Lee", year: 2022, description: "Analyzes blockchain for transparency and traceability in supply chains.", isPublished: true },
  { id: 4, version: "1", title: "Remote Learning Platforms", author: "Michael Brown", year: 2021, description: "Evaluates the effectiveness of online platforms in higher education.", isPublished: true },
  { id: 5, version: "1", title: "Smart Cities Development", author: "Emily Carter", year: 2020, description: "Explores IoT technologies for urban infrastructure management.", isPublished: false },
  { id: 6, version: "1", title: "Renewable Energy Adoption", author: "James Wilson", year: 2019, description: "Case study on wind and solar integration in national power grids.", isPublished: true },
  { id: 7, version: "1", title: "E-Commerce Personalization", author: "Anna Johnson", year: 2021, description: "Examines recommendation systems in online retail.", isPublished: true },
  { id: 8, version: "1", title: "Cybersecurity in Finance", author: "Robert King", year: 2022, description: "Investigates financial fraud prevention using machine learning.", isPublished: false },
  { id: 9, version: "1", title: "Virtual Reality in Training", author: "Linda Green", year: 2023, description: "Studies VR applications in industrial safety training programs.", isPublished: true },
  { id: 10, version: "1", title: "Social Media and Mental Health", author: "Dr. Alan Hughes", year: 2020, description: "Explores the impact of social platforms on teenage well-being.", isPublished: true },
  { id: 11, version: "1", title: "Water Purification Innovation", author: "Chloe Martin", year: 2021, description: "Analyzes nanotechnology for clean drinking water solutions.", isPublished: false },
  { id: 12, version: "1", title: "Space Tourism Industry", author: "David Scott", year: 2022, description: "Reviews the emerging market of commercial space travel.", isPublished: true },
  { id: 13, version: "1", title: "Digital Twins in Manufacturing", author: "Sophia Patel", year: 2024, description: "Examines real-time digital models for factory optimization.", isPublished: true },
  { id: 14, version: "1", title: "Microfinance and Poverty Reduction", author: "Arjun Mehta", year: 2019, description: "Explores microfinance impact in rural communities.", isPublished: true },
  { id: 15, version: "1", title: "Climate Change Policy", author: "Olivia White", year: 2020, description: "Analyzes international agreements and local implementation.", isPublished: false },
  { id: 16, version: "1", title: "Digital Health Records", author: "Dr. Peter Clarke", year: 2023, description: "Studies adoption of electronic health records in Europe.", isPublished: true },
  { id: 17, version: "1", title: "Robotics in Warehousing", author: "Karen Young", year: 2021, description: "Explores robotics in optimizing supply chain warehouses.", isPublished: false },
  { id: 18, version: "1", title: "EdTech for Early Learning", author: "Tom Harris", year: 2022, description: "Evaluates gamified platforms in primary school education.", isPublished: true },
  { id: 19, version: "1", title: "Food Waste Reduction", author: "Jessica Lopez", year: 2019, description: "Case study on food redistribution and waste minimization.", isPublished: true },
  { id: 20, version: "1", title: "5G Network Deployment", author: "Hiroshi Tanaka", year: 2021, description: "Examines challenges in rolling out next-gen mobile networks.", isPublished: true },
]


export const institutions: CaseStudyInstitution[] = [
  {
    caseStudyId: 1,
    institutionName: "St. Mary’s College",
    location: "Dublin",
    description: "Clinical pilot site for AI diagnostics."
  },
  {
    caseStudyId: 1,
    institutionName: "Northshore University",
    location: "Glasgow",
    description: "Partner for model validation."
  },
  {
    caseStudyId: 2,
    institutionName: "AgriTech Institute",
    location: "Cork",
    description: "Field trials in sustainable farming."
  },
  {
    caseStudyId: 3,
    institutionName: "SupplyChain Academy",
    location: "London",
    description: "Blockchain PoC collaboration."
  },
  {
    caseStudyId: 3,
    institutionName: "TechLabs",
    location: "Leeds",
    description: "Traceability data provider."
  }
]