import { sql } from "drizzle-orm";
import { pgTable, text, varchar, real, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const locations = pgTable("locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'settlement', 'dungeon', 'landmark', 'trader', 'faction'
  description: text("description"),
  x: real("x").notNull(), // X coordinate (0-100 percentage)
  y: real("y").notNull(), // Y coordinate (0-100 percentage)
  icon: text("icon").default("map-pin"), // Icon identifier
  safetyRating: integer("safety_rating").default(3), // 1-5 star rating
  isPublished: boolean("is_published").default(false),
});

export const vendors = pgTable("vendors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  locationId: varchar("location_id").references(() => locations.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  hours: text("hours").default("Unknown"),
  services: jsonb("services").$type<string[]>().default([]), // Array of service tags
});

export const roads = pgTable("roads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromLocationId: varchar("from_location_id").references(() => locations.id).notNull(),
  toLocationId: varchar("to_location_id").references(() => locations.id).notNull(),
  pathData: text("path_data").notNull(), // SVG path data
  isPublished: boolean("is_published").default(false),
});

export const mapState = pgTable("map_state", {
  id: varchar("id").primaryKey().default("singleton"),
  lastPublishedAt: text("last_published_at"),
  adminCode: text("admin_code").notNull().default("HOUSE-ALWAYS-WINS"),
});

export const insertLocationSchema = createInsertSchema(locations).omit({
  id: true,
});

export const insertVendorSchema = createInsertSchema(vendors).omit({
  id: true,
});

export const insertRoadSchema = createInsertSchema(roads).omit({
  id: true,
});

export const locationEditorSchema = insertLocationSchema.extend({
  vendors: z.array(insertVendorSchema.omit({ locationId: true })).optional(),
});

export type Location = typeof locations.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type Road = typeof roads.$inferSelect;
export type InsertRoad = z.infer<typeof insertRoadSchema>;
export type MapState = typeof mapState.$inferSelect;
export type LocationEditor = z.infer<typeof locationEditorSchema>;

export interface LocationWithVendors extends Location {
  vendors: Vendor[];
}

export interface MapData {
  locations: LocationWithVendors[];
  roads: Road[];
  lastPublishedAt?: string;
}
