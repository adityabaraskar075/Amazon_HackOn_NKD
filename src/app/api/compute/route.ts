import { type NextRequest, NextResponse } from "next/server";
import { FHE } from "@/lib/fhe";

// These are in-memory variables to simulate a persistent, encrypted state on the server.
// In a real application, this would be stored per user in a database, still in its encrypted form.
let encryptedTotal = FHE.encrypt(0);
let encryptedBudgetLimit = FHE.encrypt(12000); // Default budget limit

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Handler for setting a new budget limit
    if (body.ctBudget) {
      if (typeof body.ctBudget !== 'string') {
        return NextResponse.json({ error: "Invalid ciphertext for budget provided." }, { status: 400 });
      }
      encryptedBudgetLimit = body.ctBudget;
      // It's good practice to reset the total when the budget changes in this demo context
      encryptedTotal = FHE.encrypt(0);
      return NextResponse.json({ success: true, message: 'Budget limit updated successfully. Total spend has been reset.' });
    }

    // Handler for adding a new transaction amount
    if (body.ctAmount) {
      if (typeof body.ctAmount !== 'string') {
        return NextResponse.json({ error: "Invalid ciphertext for amount provided." }, { status: 400 });
      }
      
      // Homomorphically add the new transaction amount to the total.
      encryptedTotal = FHE.add(encryptedTotal, body.ctAmount);
      
      // Homomorphically check if the new total is greater than the encrypted budget limit.
      const ctAlert = FHE.gt_ct(encryptedTotal, encryptedBudgetLimit);

      // Return the new encrypted total and the encrypted alert flag.
      return NextResponse.json({ ctTotal: encryptedTotal, ctAlert });
    }
    
    // If the request body doesn't match expected formats
    return NextResponse.json({ error: "Invalid request. Provide 'ctBudget' or 'ctAmount'." }, { status: 400 });

  } catch (error) {
    console.error("FHE computation error:", error);
    return NextResponse.json({ error: "An error occurred during FHE computation." }, { status: 500 });
  }
}
