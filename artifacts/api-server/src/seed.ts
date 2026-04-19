import bcrypt from "bcryptjs";
import { db, usersTable, requestsTable, agreementsTable, notificationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("Seeding demo data...");

  const existingCustomer = await db.select().from(usersTable).where(eq(usersTable.email, "customer@demo.com"));
  if (existingCustomer.length > 0) {
    console.log("Demo data already exists, skipping.");
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash("demo123", 10);

  const [customer] = await db.insert(usersTable).values({
    name: "Priya Sharma",
    email: "customer@demo.com",
    passwordHash,
    role: "customer",
    phone: "+91 9876543210",
    rating: 4.8,
    totalRatings: 12,
  }).returning();

  const [provider] = await db.insert(usersTable).values({
    name: "Raju Prasad",
    email: "provider@demo.com",
    passwordHash,
    role: "provider",
    phone: "+91 8765432109",
    vehicleType: "e-Rickshaw",
    rating: 4.5,
    totalRatings: 28,
  }).returning();

  const [req1] = await db.insert(requestsTable).values({
    customerId: customer.id,
    providerId: provider.id,
    pickupLocation: "Connaught Place, Delhi",
    dropLocation: "Lajpat Nagar, Delhi",
    description: "Fragile electronics — please handle with care",
    serviceType: "delivery",
    status: "in_progress",
    offeredPrice: 86,
    agreedPrice: 86,
    distanceKm: 8,
  }).returning();

  await db.insert(agreementsTable).values({
    requestId: req1.id,
    terms: `Service Agreement between Priya Sharma (customer) and Raju Prasad (provider) for delivery service from Connaught Place, Delhi to Lajpat Nagar, Delhi. Agreed price: ₹86.`,
    agreedPrice: 86,
    customerSigned: true,
    providerSigned: true,
    fullyExecuted: true,
  });

  const [req2] = await db.insert(requestsTable).values({
    customerId: customer.id,
    pickupLocation: "Saket, Delhi",
    dropLocation: "Noida Sector 18",
    description: "Office furniture — 2 chairs and a small table",
    serviceType: "transport",
    status: "requested",
    offeredPrice: 185,
    distanceKm: 15,
  }).returning();

  const [req3] = await db.insert(requestsTable).values({
    customerId: customer.id,
    providerId: provider.id,
    pickupLocation: "Dwarka Sector 10",
    dropLocation: "Rohini Sector 3",
    description: "10 boxes of grocery items",
    serviceType: "logistics",
    status: "completed",
    offeredPrice: 198,
    agreedPrice: 198,
    distanceKm: 12,
    completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  }).returning();

  await db.insert(notificationsTable).values({
    userId: customer.id,
    type: "request_accepted",
    title: "Request Accepted",
    message: `Your request from Connaught Place to Lajpat Nagar has been accepted by Raju Prasad.`,
    requestId: req1.id,
    isRead: false,
  });

  await db.insert(notificationsTable).values({
    userId: customer.id,
    type: "request_updated",
    title: "Delivery Completed",
    message: `Your delivery from Dwarka Sector 10 to Rohini Sector 3 has been completed.`,
    requestId: req3.id,
    isRead: true,
  });

  console.log("Seed complete!");
  console.log(`Customer: customer@demo.com / demo123`);
  console.log(`Provider: provider@demo.com / demo123`);
  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });
