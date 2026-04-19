import { pgTable, text, serial, timestamp, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { requestsTable } from "./requests";

export const trackingUpdatesTable = pgTable("tracking_updates", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull().references(() => requestsTable.id),
  status: text("status").notNull(),
  message: text("message").notNull(),
  lat: real("lat"),
  lng: real("lng"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTrackingUpdateSchema = createInsertSchema(trackingUpdatesTable).omit({ id: true, createdAt: true });
export type InsertTrackingUpdate = z.infer<typeof insertTrackingUpdateSchema>;
export type TrackingUpdate = typeof trackingUpdatesTable.$inferSelect;
