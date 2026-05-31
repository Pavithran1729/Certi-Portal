import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user: caller }, error: authError } = await anonClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { certificateId, action, remarks } = await req.json();

    if (!certificateId || !action || !["approve", "reject"].includes(action)) {
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the caller's approval step for this certificate
    const { data: approvalStep, error: stepErr } = await supabase
      .from("certificate_approvals")
      .select("*")
      .eq("certificate_id", certificateId)
      .eq("authority_user_id", caller.id)
      .single();

    if (stepErr || !approvalStep) {
      return new Response(JSON.stringify({ error: "No approval step found for you" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (approvalStep.status !== "pending") {
      return new Response(JSON.stringify({ error: "Already acted on this certificate" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if previous approvals are all approved
    if (approvalStep.approval_order > 1) {
      const { data: previousSteps } = await supabase
        .from("certificate_approvals")
        .select("status")
        .eq("certificate_id", certificateId)
        .lt("approval_order", approvalStep.approval_order);

      const allPreviousApproved = (previousSteps ?? []).every((s: { status: string }) => s.status === "approved");
      if (!allPreviousApproved) {
        return new Response(JSON.stringify({ error: "Waiting for previous authority approval" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Check for race condition - verify certificate hasn't been modified
    const { data: currentCert } = await supabase
      .from("certificates")
      .select("updated_at, status")
      .eq("id", certificateId)
      .single();

    if (currentCert?.status !== "pending") {
      return new Response(
        JSON.stringify({ error: "Certificate status has changed. Please refresh and try again." }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update this approval step
    const newStatus = action === "approve" ? "approved" : "rejected";
    await supabase
      .from("certificate_approvals")
      .update({
        status: newStatus,
        remarks: remarks || null,
        acted_at: new Date().toISOString(),
      })
      .eq("id", approvalStep.id);

    if (action === "reject") {
      // If rejected, update the certificate status to rejected
      await supabase
        .from("certificates")
        .update({
          status: "rejected",
          admin_remarks: `Rejected by authority (step ${approvalStep.approval_order}): ${remarks || "No reason provided"}`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", certificateId);

      return new Response(
        JSON.stringify({ message: "Certificate rejected" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if all approval steps are now approved
    const { data: allSteps } = await supabase
      .from("certificate_approvals")
      .select("status")
      .eq("certificate_id", certificateId);

    const allApproved = (allSteps ?? []).every((s: { status: string }) => s.status === "approved");

    if (allApproved) {
      // All authorities approved - mark certificate as approved
      await supabase
        .from("certificates")
        .update({
          status: "approved",
          issue_date: new Date().toISOString(),
          admin_remarks: "Approved by all authorities",
        })
        .eq("id", certificateId);
    }

    return new Response(
      JSON.stringify({
        message: action === "approve" ? "Approved successfully" : "Rejected",
        allApproved,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
