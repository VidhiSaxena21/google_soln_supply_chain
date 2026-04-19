import { pgTable, text, serial, timestamp, real, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { requestsTable } from "./requests";

export const agreementsTable = pgTable("agreements", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull().references(() => requestsTable.id).unique(),
  terms: text("terms").notNull(),
  agreedPrice: real("agreed_price").notNull(),
  customerSigned: boolean("customer_signed").notNull().default(false),
  providerSigned: boolean("provider_signed").notNull().default(false),
  customerSignedAt: timestamp("customer_signed_at", { withTimezone: true }),
  providerSignedAt: timestamp("provider_signed_at", { withTimezone: true }),
  fullyExecuted: boolean("fully_executed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAgreementSchema = createInsertSchema(agreementsTable).omit({ id: true, createdAt: true });
export type InsertAgreement = z.infer<typeof insertAgreementSchema>;
export type Agreement = typeof agreementsTable.$inferSelect;
