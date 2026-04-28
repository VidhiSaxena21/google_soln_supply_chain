import { pgTable, text, serial, timestamp, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const requestsTable = pgTable("requests", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => usersTable.id),
  providerId: integer("provider_id").references(() => usersTable.id),
  receiverName: text("receiver_name"),
  receiverPhone: text("receiver_phone"),
  receiverEmail: text("receiver_email"),
  receiverBusiness: text("receiver_business"),
  consignmentId: text("consignment_id"),
  bookingReference: text("booking_reference"),
  invoiceReference: text("invoice_reference"),
  originStation: text("origin_station"),
  destinationStation: text("destination_station"),
  expectedUnloadStation: text("expected_unload_station"),
  trainReference: text("train_reference"),
  coachOrWagon: text("coach_or_wagon"),
  cargoCategory: text("cargo_category"),
  declaredValue: real("declared_value"),
  riskNote: text("risk_note"),
  pickupLocation: text("pickup_location").notNull(),
  dropLocation: text("drop_location").notNull(),
  pickupLat: real("pickup_lat"),
  pickupLng: real("pickup_lng"),
  dropLat: real("drop_lat"),
  dropLng: real("drop_lng"),
  description: text("description").notNull(),
  serviceType: text("service_type").notNull().default("delivery"),
  status: text("status").notNull().default("requested"),
  offeredPrice: real("offered_price"),
  agreedPrice: real("agreed_price"),
  distanceKm: real("distance_km"),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertRequestSchema = createInsertSchema(requestsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertRequest = z.infer<typeof insertRequestSchema>;
export type Request = typeof requestsTable.$inferSelect;
