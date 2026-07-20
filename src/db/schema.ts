import {
  boolean,
  integer,
  json,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const teamMembers = pgTable("team_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  bio: text("bio").notNull(),
  photo_url: text("photo_url"),
  linkedin_url: text("linkedin_url"),
  github_url: text("github_url"),
  twitter_url: text("twitter_url"),
  order_index: integer("order_index").notNull().default(0),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  tagline: text("tagline").notNull(),
  description: text("description").notNull(),
  cover_url: text("cover_url"),
  external_url: text("external_url"),
  github_url: text("github_url"),
  status: text("status", {
    enum: ["development", "live", "archived"],
  }).notNull(),
  is_featured: boolean("is_featured").notNull().default(false),
  order_index: integer("order_index").notNull().default(0),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const blogPosts = pgTable("blog_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  category: text("category", {
    enum: ["Product Update", "Announcement", "Roadmap", "Story"],
  }).notNull(),
  excerpt: text("excerpt").notNull(),
  content: json("content").notNull(),
  cover_url: text("cover_url"),
  author: text("author").notNull().default("CODEDDEVS"),
  is_published: boolean("is_published").notNull().default(false),
  showInRecognition: boolean("show_in_recognition").notNull().default(false),
  placement: text("placement"),
  published_at: timestamp("published_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  password_hash: text("password_hash").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});
