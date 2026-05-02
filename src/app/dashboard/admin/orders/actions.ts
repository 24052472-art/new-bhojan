"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";

export async function finalizeCheckout(orderId: string, tableId: string | null, checkoutData: any) {
  try {
    // 1. Update Order Status
    const { error: orderError } = await supabaseAdmin
      .from("orders")
      .update({
        status: 'completed',
        payment_status: 'paid',
        grand_total: checkoutData.grand_total,
        customer_email: checkoutData.customer_email,
        settled_by: checkoutData.settled_by,
        settled_at: new Date().toISOString()
      })
      .eq("id", orderId);

    if (orderError) throw orderError;

    // 2. Update Table Status if applicable
    if (tableId) {
      await supabaseAdmin
        .from("tables")
        .update({ status: 'available' })
        .eq("id", tableId);
    }

    return { success: true };
  } catch (err: any) {
    console.error("Checkout Action Failed:", err);
    return { success: false, error: err.message };
  }
}
