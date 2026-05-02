"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";

export async function resetAdminMenu(resId: string) {
  if (!resId) return { error: "Restaurant ID required" };
  
  try {
    // Sequential deletion to respect foreign keys
    await supabaseAdmin.from("menu_items").delete().eq("restaurant_id", resId);
    await supabaseAdmin.from("menu_item_groups").delete().eq("restaurant_id", resId);
    await supabaseAdmin.from("menu_subcategories").delete().eq("restaurant_id", resId);
    await supabaseAdmin.from("menu_categories").delete().eq("restaurant_id", resId);
    
    return { success: true };
  } catch (err: any) {
    console.error("Reset Error:", err);
    return { error: err.message };
  }
}

export async function processMassUpload(resId: string, items: any[]) {
  if (!resId) return { error: "Restaurant ID required" };
  
  try {
    for (const item of items) {
      const categoryName = item.CategoryName?.trim();
      if (!categoryName) continue;

      // 1. Get or Create Category
      let { data: category } = await supabaseAdmin
        .from('menu_categories')
        .select('id')
        .eq('restaurant_id', resId)
        .ilike('name', categoryName)
        .maybeSingle();

      if (!category) {
        const { data: newCat, error: catErr } = await supabaseAdmin
          .from('menu_categories')
          .insert([{ name: categoryName, restaurant_id: resId }])
          .select('id')
          .single();
        if (catErr) throw catErr;
        category = newCat;
      }

      if (!category) continue;

      // 2. Get or Create Subcategory
      const subcategoryName = item.SubCategoryName?.trim() || categoryName;
      let { data: subcategory } = await supabaseAdmin
        .from('menu_subcategories')
        .select('id')
        .eq('restaurant_id', resId)
        .eq('category_id', category.id)
        .ilike('name', subcategoryName)
        .maybeSingle();

      if (!subcategory) {
        const { data: newSub, error: subErr } = await supabaseAdmin
          .from('menu_subcategories')
          .insert([{ name: subcategoryName, restaurant_id: resId, category_id: category.id }])
          .select('id')
          .single();
        if (subErr) throw subErr;
        subcategory = newSub;
      }

      if (!subcategory) continue;

      // 3. Get or Create Group
      const groupName = item.ItemGroupName?.trim() || subcategoryName;
      let { data: group } = await supabaseAdmin
        .from('menu_item_groups')
        .select('id')
        .eq('restaurant_id', resId)
        .eq('subcategory_id', subcategory.id)
        .ilike('name', groupName)
        .maybeSingle();

      if (!group) {
        const { data: newGroup, error: groupErr } = await supabaseAdmin
          .from('menu_item_groups')
          .insert([{ name: groupName, restaurant_id: resId, subcategory_id: subcategory.id }])
          .select('id')
          .single();
        if (groupErr) throw groupErr;
        group = newGroup;
      }

      if (!group) continue;

      // 4. Insert Item
      await supabaseAdmin.from('menu_items').insert([{
        restaurant_id: resId,
        item_group_id: group.id,
        name: item.ItemName || "Unnamed",
        price: parseFloat(item.Price) || 0,
        description: item.Description || "",
        image_url: item.ImageURL || "",
        item_type: item.ItemType || "Veg",
        is_veg: item.ItemType === 'Veg'
      }]);
    }
    
    return { success: true };
  } catch (err: any) {
    console.error("Upload Error:", err);
    return { error: err.message };
  }
}
