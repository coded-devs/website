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

export const careers = pgTable("careers", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  type: text("type").notNull(),
  location: text("location").notNull().default("Lagos, Nigeria / Remote"),
  description: text("description").notNull(),
  requirements: text("requirements").notNull(),
  is_open: boolean("is_open").notNull().default(true),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const careerApplications = pgTable("career_applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  // ON DELETE cascade: deleting a role removes the applications filed against
  // it, so no application is ever orphaned from its posting.
  career_id: uuid("career_id")
    .notNull()
    .references(() => careers.id, { onDelete: "cascade" }),
  full_name: text("full_name").notNull(),
  email: text("email").notNull(),
  portfolio_url: text("portfolio_url"),
  github_url: text("github_url"),
  cover_letter: text("cover_letter").notNull(),
  status: text("status").notNull().default("pending"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const contactSubmissions = pgTable("contact_submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  full_name: text("full_name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  is_read: boolean("is_read").notNull().default(false),
  created_at: timestamp("created_at").defaultNow().notNull(),
});
