"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";

export async function getAdminTablesData(restaurantId: string) {
  try {
    const { data: tables, error: tablesError } = await supabaseAdmin
      .from("tables")
      .select("*, profiles!assigned_waiter_id(full_name)")
      .eq("restaurant_id", restaurantId)
      .order("table_number", { ascending: true });

    if (tablesError) throw tablesError;

    const { data: staff, error: staffError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .eq("role", "waiter");

    if (staffError) throw staffError;

    return { tables: tables || [], staff: staff || [], error: null };
  } catch (err: any) {
    console.error("Error in getAdminTablesData:", err);
    return { tables: [], staff: [], error: err.message };
  }
}

export async function resetTableStatus(tableId: string) {
  const { error } = await supabaseAdmin.from("tables").update({ status: 'available' }).eq("id", tableId);
  return { error: error?.message || null };
}

export async function addTable(restaurantId: string, number: string, capacity: number) {
  const { error } = await supabaseAdmin.from("tables").insert([{
    restaurant_id: restaurantId,
    table_number: number,
    capacity: capacity,
    status: 'available'
  }]);
  return { error: error?.message || null };
}

export async function deleteTable(tableId: string) {
  const { error } = await supabaseAdmin.from("tables").delete().eq("id", tableId);
  return { error: error?.message || null };
}
