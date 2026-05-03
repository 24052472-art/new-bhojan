"use server";

// Server Actions for Super Admin Dashboard

import { supabaseAdmin } from "@/lib/supabase/admin";

export async function getSuperAdminStats() {
  try {
    const [resCount, userCount, orderCount] = await Promise.all([
      supabaseAdmin.from("restaurants").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("orders").select("*", { count: "exact", head: true }),
    ]);

    const { data: revenueData } = await supabaseAdmin
      .from("orders")
      .select("grand_total")
      .eq("payment_status", "paid");

    const totalRev = revenueData?.reduce((acc, curr) => acc + (Number(curr.grand_total) || 0), 0) || 0;

    const { data: latestOrders } = await supabaseAdmin
      .from("orders")
      .select("*, restaurants(name)")
      .order("created_at", { ascending: false })
      .limit(5);

    return {
      stats: {
        restaurants: resCount.count || 0,
        users: userCount.count || 0,
        orders: orderCount.count || 0,
        revenue: totalRev
      },
      recentActivity: latestOrders || [],
      error: null
    };
  } catch (e: any) {
    console.error("Error in getSuperAdminStats:", e);
    return { stats: null, recentActivity: [], error: e.message };
  }
}

export async function getSuperAdminRestaurants() {
  try {
    const { data, error } = await supabaseAdmin
      .from("restaurants")
      .select(`
        *,
        user_profiles:profiles(count),
        menu_items(count)
      `);

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (e: any) {
    console.error("Error in getSuperAdminRestaurants:", e);
    return { data: [], error: e.message };
  }
}

export async function getSuperAdminUsers() {
  try {
    const [pRes, rRes] = await Promise.all([
      supabaseAdmin.from("profiles").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("restaurants").select("*")
    ]);

    if (pRes.error) throw pRes.error;
    if (rRes.error) throw rRes.error;

    return {
      profiles: pRes.data || [],
      restaurants: rRes.data || [],
      error: null
    };
  } catch (e: any) {
    console.error("Error in getSuperAdminUsers:", e);
    return { profiles: [], restaurants: [], error: e.message };
  }
}

export async function deleteRestaurant(id: string) {
  try {
    // Delete associated data first
    const { data: orders } = await supabaseAdmin.from("orders").select("id").eq("restaurant_id", id);
    const orderIds = orders?.map(o => o.id) || [];

    if (orderIds.length > 0) {
      await supabaseAdmin.from("order_items").delete().in("order_id", orderIds);
    }

    await supabaseAdmin.from("orders").delete().eq("restaurant_id", id);
    await supabaseAdmin.from("menu_items").delete().eq("restaurant_id", id);
    await supabaseAdmin.from("tables").delete().eq("restaurant_id", id);
    await supabaseAdmin.from("user_profiles").delete().eq("restaurant_id", id);
    await supabaseAdmin.from("profiles").delete().eq("restaurant_id", id);
    
    const { error } = await supabaseAdmin.from("restaurants").delete().eq("id", id);
    if (error) throw error;

    return { success: true, error: null };
  } catch (e: any) {
    console.error("Error in deleteRestaurant:", e);
    return { success: false, error: e.message };
  }
}

export async function deleteUser(id: string) {
  try {
    const { error } = await supabaseAdmin.from("profiles").delete().eq("id", id);
    if (error) throw error;
    return { success: true, error: null };
  } catch (e: any) {
    console.error("Error in deleteUser:", e);
    return { success: false, error: e.message };
  }
}

export async function updateRestaurant(id: string, updates: any) {
  try {
    const { error } = await supabaseAdmin.from("restaurants").update(updates).eq("id", id);
    if (error) throw error;
    return { success: true, error: null };
  } catch (e: any) {
    console.error("Error in updateRestaurant:", e);
    return { success: false, error: e.message };
  }
}

export async function onboardTenant(payload: {
  owner: { name: string; email: string; phone: string; address: string };
  restaurant: { name: string; category: string; location: string; slug: string };
  plan: { id: string; duration: number };
}) {
  try {
    // 1. Check for Duplicate Slug & Resolve
    let finalSlug = payload.restaurant.slug;
    const { data: existingRes } = await supabaseAdmin
      .from("restaurants")
      .select("id")
      .eq("slug", finalSlug)
      .maybeSingle();

    if (existingRes) {
      finalSlug = `${payload.restaurant.slug}-${Math.random().toString(36).slice(-4)}`;
    }

    // 2. Create User in Firebase Auth via REST API
    const tempPassword = "Bhojan@2026"; // Standard secure temporary password
    let authUserId: string;
    try {
      const fbResponse = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: payload.owner.email,
            password: tempPassword,
            returnSecureToken: true,
          }),
        }
      );

      const fbData = await fbResponse.json();
      
      if (fbData.error) {
        if (fbData.error.message === "EMAIL_EXISTS") {
           // If email exists, we need to find the UID. 
           // We can't get it from Firebase easily without Admin SDK, so we check Supabase first.
           const { data: existingProfile } = await supabaseAdmin.from("profiles").select("id").eq("email", payload.owner.email).maybeSingle();
           
           if (existingProfile) {
             authUserId = existingProfile.id;
           } else {
             // This is a critical edge case: Email in Firebase but no Profile in Supabase.
             // We return a specific error or handle it. 
             // For now, we'll try to proceed with a dummy ID or tell the admin.
             throw new Error("This email is already registered in Firebase but has no linked profile. Please delete the user from Firebase first or use a different email.");
           }
        } else {
          throw new Error(fbData.error.message);
        }
      } else {
        authUserId = fbData.localId;
      }
    } catch (e: any) {
      console.error("Firebase Auth Error:", e);
      throw e;
    }

    // 3. Create Restaurant
    const { data: restaurant, error: resError } = await supabaseAdmin
      .from("restaurants")
      .insert({
        name: payload.restaurant.name,
        slug: finalSlug,
        address: payload.restaurant.location,
        phone: payload.owner.phone,
        is_active: true,
        subscription_status: payload.plan.id
      })
      .select()
      .single();

    if (resError) throw resError;

    // 4. Create/Update Owner Profile
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: authUserId,
        full_name: payload.owner.name,
        email: payload.owner.email,
        role: "owner",
        restaurant_id: restaurant.id,
        is_active: true
      });

    if (profileError) throw profileError;

    return { 
      success: true, 
      inviteLink: `${process.env.NEXT_PUBLIC_APP_URL || 'https://bhojan.app'}/login`, 
      tempPassword,
      error: null 
    };
  } catch (e: any) {
    console.error("Error in onboardTenant:", e);
    return { success: false, error: e.message, inviteLink: null };
  }
}
