"use server";

import { addPayment, getAllPendingPayments } from "@/lib/data-service";
import { Buffer } from "buffer";
import { v4 as uuidv4 } from "uuid";
import fs from "fs/promises";
import path from "path";

// ✅ Handle bank transfer submission with file upload
export async function submitBankTransferPayment(formData: FormData) {
  if (!(formData instanceof FormData)) {
    throw new Error("Invalid submission: not FormData");
  }

  const bankId = formData.get("bank") as string;
  const bankName = "Your Bank Name"; // TODO: Lookup based on bankId
  const packageId = formData.get("package") as string;
  const referenceNumber = formData.get("reference") as string;
  const screenshot = formData.get("screenshot") as File;

  const amount = 10; // TODO: Lookup based on packageId
  const credits = 20000;
  const currency = "USD";

  if (!bankId || !referenceNumber || !screenshot) {
    throw new Error("Missing required payment fields.");
  }

  const arrayBuffer = await screenshot.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const filename = `receipt-${uuidv4()}.png`;
  const filePath = path.join(process.cwd(), "public", "uploads", filename);

  // ✅ Save the file locally
  await fs.writeFile(filePath, buffer);

  const screenshotUrl = `/uploads/${filename}`; // Public URL

  await addPayment({
    id: uuidv4(),
    userId: "CURRENT_USER_ID", // TODO: Replace with actual user from session
    bankId,
    bankName,
    amount,
    credits,
    referenceNumber,
    screenshotUrl,
    status: "pending",
    date: new Date().toISOString(),
    currency,
  });
}

// Optional: Admin - fetch all pending payments
export async function fetchPendingBankPayments() {
  return await getAllPendingPayments();
}
