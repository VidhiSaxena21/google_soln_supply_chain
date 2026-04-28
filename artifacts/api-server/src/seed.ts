import bcrypt from "bcryptjs";
import {
  agreementsTable,
  db,
  disputesTable,
  notificationsTable,
  requestsTable,
  trackingUpdatesTable,
  usersTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("Seeding railway cargo demo data...");

  const existingUsers = await db.select().from(usersTable).where(eq(usersTable.email, "shipper@demo.com"));
  if (existingUsers.length > 0) {
    console.log("Demo data already exists, skipping.");
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash("demo123", 10);

  const [shipper] = await db.insert(usersTable).values({
    name: "Mahajan Agro Traders",
    email: "shipper@demo.com",
    passwordHash,
    role: "shipper",
    phone: "+91 9810011122",
    rating: 4.9,
    totalRatings: 16,
  }).returning();

  const [receiver] = await db.insert(usersTable).values({
    name: "Gurpreet Singh",
    email: "receiver@demo.com",
    passwordHash,
    role: "receiver",
    phone: "+91 9872203344",
    rating: 4.7,
    totalRatings: 5,
  }).returning();

  const [monitor] = await db.insert(usersTable).values({
    name: "North Zone Rail Monitor",
    email: "monitor@demo.com",
    passwordHash,
    role: "railway_monitor",
    phone: "+91 1122334455",
    rating: 4.8,
    totalRatings: 3,
  }).returning();

  const [trainStaff] = await db.insert(usersTable).values({
    name: "Rakesh Yadav",
    email: "staff@demo.com",
    passwordHash,
    role: "train_staff",
    phone: "+91 9898981212",
    vehicleType: "Parcel guard | SLR-2",
    rating: 4.6,
    totalRatings: 31,
  }).returning();

  const [req1] = await db.insert(requestsTable).values({
    customerId: shipper.id,
    providerId: trainStaff.id,
    receiverName: receiver.name,
    receiverPhone: receiver.phone,
    receiverEmail: receiver.email,
    receiverBusiness: "Singh Cloth House",
    consignmentId: "CT-MUM-JAL-1042",
    bookingReference: "IR-PCL-449103",
    invoiceReference: "INV-2881",
    originStation: "Mumbai Central",
    destinationStation: "Jalandhar City",
    expectedUnloadStation: "Jalandhar City",
    trainReference: "12925 Paschim Express",
    coachOrWagon: "SLR-2",
    cargoCategory: "Textiles",
    declaredValue: 180000,
    riskNote: "No unofficial unloading charge authorized. Escalate immediately if any cash demand is made off-platform.",
    pickupLocation: "Kalbadevi warehouse, Mumbai",
    dropLocation: "Focal Point market yard, Jalandhar",
    description: "12 bales of garment fabric for retail distribution. Receiver should verify seal count before release.",
    serviceType: "logistics",
    status: "in_progress",
    offeredPrice: 6200,
    agreedPrice: 6200,
    distanceKm: 1710,
    scheduledAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
  }).returning();

  await db.insert(agreementsTable).values({
    requestId: req1.id,
    terms: "ChainTrack railway cargo agreement for consignment CT-MUM-JAL-1042. Unload only at Jalandhar City. Any reroute, unload delay, missing wagon claim, or unofficial unloading demand must be recorded in the timeline and escalated through the monitor portal.",
    agreedPrice: 6200,
    customerSigned: true,
    providerSigned: true,
    fullyExecuted: true,
  });

  await db.insert(trackingUpdatesTable).values([
    {
      requestId: req1.id,
      status: "accepted",
      message: "Consignment loaded and seal count verified at Mumbai Central parcel office.",
      lat: 18.9697,
      lng: 72.8194,
    },
    {
      requestId: req1.id,
      status: "in_progress",
      message: "Passed Ratlam checkpoint. No diversion or off-record demand reported.",
      lat: 23.3342,
      lng: 75.0376,
    },
    {
      requestId: req1.id,
      status: "in_progress",
      message: "Entering Punjab corridor. Receiver in Jalandhar has been notified for unload readiness.",
      lat: 30.9003,
      lng: 75.8573,
    },
  ]);

  const [req2] = await db.insert(requestsTable).values({
    customerId: shipper.id,
    receiverName: receiver.name,
    receiverPhone: receiver.phone,
    receiverEmail: receiver.email,
    receiverBusiness: "Singh Cloth House",
    consignmentId: "CT-MUM-JAL-1058",
    bookingReference: "IR-PCL-449271",
    invoiceReference: "INV-2910",
    originStation: "Mumbai Central",
    destinationStation: "Jalandhar Cantt",
    expectedUnloadStation: "Jalandhar Cantt",
    trainReference: "12903 Golden Temple Mail",
    coachOrWagon: "Parcel Van 1",
    cargoCategory: "Footwear cartons",
    declaredValue: 94000,
    riskNote: "Receiver has already refused any off-book unloading charge. Monitor closely near destination.",
    pickupLocation: "Bhiwandi sorting hub, Mumbai",
    dropLocation: "Boot market lane, Jalandhar Cantt",
    description: "52 footwear cartons for festival stock. Receiver requires unload confirmation before truck pickup.",
    serviceType: "transport",
    status: "requested",
    offeredPrice: 5400,
    distanceKm: 1662,
    scheduledAt: new Date(Date.now() + 9 * 60 * 60 * 1000),
  }).returning();

  const [req3] = await db.insert(requestsTable).values({
    customerId: shipper.id,
    providerId: trainStaff.id,
    receiverName: receiver.name,
    receiverPhone: receiver.phone,
    receiverEmail: receiver.email,
    receiverBusiness: "Singh Cloth House",
    consignmentId: "CT-DEL-LDH-0991",
    bookingReference: "IR-PCL-441802",
    invoiceReference: "INV-2750",
    originStation: "New Delhi",
    destinationStation: "Ludhiana Junction",
    expectedUnloadStation: "Ludhiana Junction",
    trainReference: "12497 Shan-e-Punjab",
    coachOrWagon: "SLR-1",
    cargoCategory: "Machine spares",
    declaredValue: 56000,
    pickupLocation: "Sadar Bazar loading point, Delhi",
    dropLocation: "Industrial shed 3, Ludhiana",
    description: "Six crates of machine spare parts delivered successfully with sealed handoff.",
    serviceType: "delivery",
    status: "completed",
    offeredPrice: 2100,
    agreedPrice: 2100,
    distanceKm: 312,
    completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  }).returning();

  await db.insert(disputesTable).values({
    requestId: req1.id,
    raisedById: shipper.id,
    reason: "Unofficial unloading demand",
    description: "Receiver reported pressure to pay extra cash for timely unloading at Jalandhar. The consignment is still in transit, so the monitor portal should watch closely for diversion risk toward Jammu.",
    status: "under_review",
  });

  await db.insert(notificationsTable).values([
    {
      userId: shipper.id,
      type: "request_accepted",
      title: "Train staff assigned",
      message: "Consignment CT-MUM-JAL-1042 is assigned to onboard staff on 12925 Paschim Express.",
      requestId: req1.id,
      isRead: false,
    },
    {
      userId: receiver.id,
      type: "request_updated",
      title: "Incoming cargo visible",
      message: "CT-MUM-JAL-1042 is in transit and should unload at Jalandhar City. Watch the receiver portal for handoff proof.",
      requestId: req1.id,
      isRead: false,
    },
    {
      userId: shipper.id,
      type: "dispute_update",
      title: "Monitor review started",
      message: "The unofficial unloading demand case for CT-MUM-JAL-1042 is now under review by North Zone Rail Monitor.",
      requestId: req1.id,
      isRead: false,
    },
    {
      userId: trainStaff.id,
      type: "request_updated",
      title: "Receiver confirmed readiness",
      message: "Receiver portal for CT-MUM-JAL-1042 shows contact readiness at Jalandhar City.",
      requestId: req1.id,
      isRead: true,
    },
    {
      userId: receiver.id,
      type: "request_updated",
      title: "Completed cargo record",
      message: "CT-DEL-LDH-0991 remains available in your portal as proof of successful unload.",
      requestId: req3.id,
      isRead: true,
    },
  ]);

  console.log("Seed complete!");
  console.log("Shipper: shipper@demo.com / demo123");
  console.log("Receiver: receiver@demo.com / demo123");
  console.log("Railway monitor: monitor@demo.com / demo123");
  console.log("Train staff: staff@demo.com / demo123");
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
