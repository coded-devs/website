import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  adminUsers,
  blogPosts,
  careerApplications,
  careers,
  contactSubmissions,
  products,
  teamMembers,
} from "@/db/schema";

export type TeamMember = InferSelectModel<typeof teamMembers>;
export type NewTeamMember = InferInsertModel<typeof teamMembers>;

export type ProductSelect = InferSelectModel<typeof products>;
export type ProductInsert = InferInsertModel<typeof products>;

export type BlogPost = InferSelectModel<typeof blogPosts>;
export type NewBlogPost = InferInsertModel<typeof blogPosts>;

export type Career = InferSelectModel<typeof careers>;
export type NewCareer = InferInsertModel<typeof careers>;

export type CareerApplication = InferSelectModel<typeof careerApplications>;
export type NewCareerApplication = InferInsertModel<typeof careerApplications>;

export type ContactSubmission = InferSelectModel<typeof contactSubmissions>;
export type NewContactSubmission = InferInsertModel<typeof contactSubmissions>;

export type AdminUser = InferSelectModel<typeof adminUsers>;
export type NewAdminUser = InferInsertModel<typeof adminUsers>;
