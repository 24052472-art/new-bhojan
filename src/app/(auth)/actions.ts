"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";

export async function getProfileByAuth(uid: string, email: string) {
  try {
    let { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", uid)
      .single();

    if (error || !profile) {
      if (!email) return { profile: null, error: "Profile not found. Please sign up first." };
      
      const { data: emailProfile, error: emailError } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("email", email)
        .single();
        
      if (emailError || !emailProfile) {
        return { profile: null, error: "Profile not found. Please sign up first." };
      }
      
      // Update ID to match Firebase UID
      await supabaseAdmin.from("profiles").update({ id: uid }).eq("email", email);
      return { profile: emailProfile, error: null };
    }
    
    return { profile, error: null };
  } catch (e: any) {
    return { profile: null, error: e.message };
  }
}

export async function getStaffProfile(staffId: string) {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", staffId)
      .single();

    if (error || !profile) return { profile: null, error: "Invalid Staff ID. Please check with your manager." };
    
    return { profile, error: null };
  } catch (e: any) {
    return { profile: null, error: e.message };
  }
}
export async function createRestaurantAndProfile(uid: string, email: string, fullName: string, restaurantName: string, serviceTypes: string[]) {
  try {
    const randomSuffix = Math.floor(Math.random() * 1000);
    const slug = `${restaurantName.toLowerCase().replace(/\s+/g, '-')}-${randomSuffix}`;
    
    // 1. Create Restaurant
    const { data: resData, error: resError } = await supabaseAdmin.from("restaurants").insert([
      { 
        name: restaurantName, 
        slug: slug, 
        is_active: true,
        subscription_status: 'Trial',
        category: serviceTypes.join(", ")
      }
    ]).select().single();

    if (resError) throw resError;

    // 2. Create Profile linked to Restaurant
    const { error: profileError } = await supabaseAdmin.from("profiles").upsert({ 
      id: uid,
      restaurant_id: resData.id,
      role: 'owner',
      full_name: fullName,
      email: email,
      is_active: true
    });

    if (profileError) throw profileError;

    return { success: true, error: null };
  } catch (err: any) {
    console.error("Signup Action Error:", err);
    return { success: false, error: err.message };
  }
}
