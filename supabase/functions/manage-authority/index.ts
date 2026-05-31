import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      return jsonResponse({ error: "Server configuration error: Missing Env Vars" }, 500);
    }

    // Verify caller identity
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: claimsData, error: claimsError } = await userClient.auth.getUser(token);
    if (claimsError || !claimsData?.user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const callerId = claimsData.user.id;

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Check caller is admin
    const { data: callerRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "admin")
      .maybeSingle();

    if (!callerRole) {
      return jsonResponse({ error: "Admin access required" }, 403);
    }

    const body = await req.json();
    const { action, ...payload } = body;

    if (action === "create") {
      const { email, password, display_name, role_title } = payload;
      if (!email || !password || !display_name || !role_title) {
        return jsonResponse({ error: "Missing required fields" }, 400);
      }

      const { data: userData, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: display_name },
      });

      if (createError) {
        return jsonResponse({ error: createError.message }, 400);
      }

      if (userData.user) {
        const { error: roleError } = await supabase
          .from("user_roles")
          .upsert(
            { user_id: userData.user.id, role: "authority" },
            { onConflict: "user_id" }
          );

        if (roleError) {
          console.error("Role insert error:", roleError);
        }

        const { error: profileError } = await supabase
          .from("authority_profiles")
          .insert({
            user_id: userData.user.id,
            display_name,
            role_title,
          });

        if (profileError) {
          console.error("Profile insert error:", profileError);
        }
      }

      return jsonResponse({ message: "Authority created", user_id: userData.user?.id }, 200);
    }

    if (action === "update") {
      const { authority_user_id, display_name, role_title, is_active } = payload;
      if (!authority_user_id) {
        return jsonResponse({ error: "Missing authority_user_id" }, 400);
      }

      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (display_name !== undefined) updateData.display_name = display_name;
      if (role_title !== undefined) updateData.role_title = role_title;
      if (is_active !== undefined) updateData.is_active = is_active;

      const { error } = await supabase
        .from("authority_profiles")
        .update(updateData)
        .eq("user_id", authority_user_id);

      if (error) {
        return jsonResponse({ error: error.message }, 500);
      }

      return jsonResponse({ message: "Authority updated" }, 200);
    }

    if (action === "delete") {
      const { authority_user_id } = payload;
      if (!authority_user_id) {
        return jsonResponse({ error: "Missing authority_user_id" }, 400);
      }

      const { error } = await supabase.auth.admin.deleteUser(authority_user_id);
      if (error) {
        return jsonResponse({ error: error.message }, 500);
      }

      return jsonResponse({ message: "Authority deleted" }, 200);
    }

    return jsonResponse({ error: "Unknown action" }, 400);
  } catch (error: unknown) {
    console.error("Edge function error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }
});
