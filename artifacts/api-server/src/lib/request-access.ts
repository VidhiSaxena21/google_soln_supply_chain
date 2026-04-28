import { requestsTable } from "@workspace/db";
import { type JwtPayload } from "./auth";

type RequestRow = typeof requestsTable.$inferSelect;

function normalize(value: string | null | undefined) {
  return value?.trim().toLowerCase();
}

export function isReceiverForRequest(requestRow: RequestRow, user: JwtPayload) {
  return Boolean(
    user.role === "receiver" &&
    normalize(user.email) &&
    normalize(requestRow.receiverEmail) === normalize(user.email),
  );
}

export function canAccessRequest(
  requestRow: RequestRow,
  user: JwtPayload,
  options?: { allowRequestedToTrainStaff?: boolean },
) {
  if (user.role === "railway_monitor") {
    return true;
  }

  if (user.role === "shipper") {
    return requestRow.customerId === user.userId;
  }

  if (user.role === "train_staff") {
    if (requestRow.providerId === user.userId) {
      return true;
    }

    return Boolean(options?.allowRequestedToTrainStaff && requestRow.status === "requested");
  }

  return isReceiverForRequest(requestRow, user);
}
