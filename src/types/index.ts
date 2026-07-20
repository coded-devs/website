import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  adminUsers,
  blogPosts,
  products,
  teamMembers,
} from "@/db/schema";

export type TeamMember = InferSelectModel<typeof teamMembers>;
export type NewTeamMember = InferInsertModel<typeof teamMembers>;

export type ProductSelect = InferSelectModel<typeof products>;
export type ProductInsert = InferInsertModel<typeof products>;

export type BlogPostSelect = InferSelectModel<typeof blogPosts>;
export type BlogPostInsert = InferInsertModel<typeof blogPosts>;
export type BlogPost = BlogPostSelect;
export type NewBlogPost = BlogPostInsert;

export type AdminUser = InferSelectModel<typeof adminUsers>;
export type NewAdminUser = InferInsertModel<typeof adminUsers>;
