import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

/**
 * STRIPE WEBHOOK HANDLER
 * 
 * Handles Stripe events for subscription management.
 * Idempotent by using stripe_event_id unique constraint.
 */

interface StripeEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
}

async function handleSubscriptionCreated(supabase: any, subscription: any, workspaceId: string) {
  await supabase
    .from("subscriptions")
    .update({
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    })
    .eq("workspace_id", workspaceId);
}

async function handleSubscriptionUpdated(supabase: any, subscription: any) {
  // Get plan from price metadata or product
  const plan = subscription.items?.data?.[0]?.price?.metadata?.plan || "pro";
  
  const { data: sub } = await supabase
    .from("subscriptions")
    .update({
      status: subscription.status,
      plan: plan,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id)
    .select("workspace_id")
    .single();

  if (sub?.workspace_id) {
    // Update workspace plan
    await supabase
      .from("workspaces")
      .update({ plan: plan })
      .eq("id", sub.workspace_id);

    // Update usage limits based on new plan
    const { data: planLimits } = await supabase
      .from("plan_limits")
      .select("*")
      .eq("plan", plan)
      .single();

    if (planLimits) {
      await supabase
        .from("usage_limits")
        .update({
          ai_requests_limit: planLimits.ai_requests_limit,
          automations_limit: planLimits.automations_limit,
          team_members_limit: planLimits.team_members_limit,
          storage_limit_mb: planLimits.storage_limit_mb,
          updated_at: new Date().toISOString(),
        })
        .eq("workspace_id", sub.workspace_id);
    }
  }
}

async function handleSubscriptionDeleted(supabase: any, subscription: any) {
  const { data: sub } = await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
      plan: "free",
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id)
    .select("workspace_id")
    .single();

  if (sub?.workspace_id) {
    // Downgrade workspace to free
    await supabase
      .from("workspaces")
      .update({ plan: "free" })
      .eq("id", sub.workspace_id);

    // Reset usage limits to free tier
    const { data: planLimits } = await supabase
      .from("plan_limits")
      .select("*")
      .eq("plan", "free")
      .single();

    if (planLimits) {
      await supabase
        .from("usage_limits")
        .update({
          ai_requests_limit: planLimits.ai_requests_limit,
          automations_limit: planLimits.automations_limit,
          team_members_limit: planLimits.team_members_limit,
          storage_limit_mb: planLimits.storage_limit_mb,
          updated_at: new Date().toISOString(),
        })
        .eq("workspace_id", sub.workspace_id);
    }
  }
}

async function handleInvoicePaid(supabase: any, invoice: any) {
  // Reset monthly usage on successful payment
  if (invoice.subscription) {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("workspace_id")
      .eq("stripe_subscription_id", invoice.subscription)
      .single();

    if (sub?.workspace_id) {
      await supabase
        .from("usage_limits")
        .update({
          ai_requests_used: 0,
          reset_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("workspace_id", sub.workspace_id);
    }
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse webhook payload
    const payload = await req.text();
    const event: StripeEvent = JSON.parse(payload);

    // TODO: Verify Stripe signature when STRIPE_WEBHOOK_SECRET is configured
    // const signature = req.headers.get("stripe-signature");
    // const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    console.log(`Processing Stripe event: ${event.type} (${event.id})`);

    // Check idempotency - has this event been processed?
    const { data: existingEvent } = await supabase
      .from("billing_events")
      .select("id")
      .eq("stripe_event_id", event.id)
      .single();

    if (existingEvent) {
      console.log(`Event ${event.id} already processed, skipping`);
      return new Response(JSON.stringify({ received: true, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract workspace_id from metadata if available
    const workspaceId = event.data.object.metadata?.workspace_id;

    // Store event for audit
    const { data: billingEvent, error: insertError } = await supabase
      .from("billing_events")
      .insert({
        workspace_id: workspaceId || null,
        stripe_event_id: event.id,
        event_type: event.type,
        payload: event.data.object,
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    // Process event by type
    let processingError = null;

    try {
      switch (event.type) {
        case "customer.subscription.created":
          if (workspaceId) {
            await handleSubscriptionCreated(supabase, event.data.object, workspaceId);
          }
          break;

        case "customer.subscription.updated":
          await handleSubscriptionUpdated(supabase, event.data.object);
          break;

        case "customer.subscription.deleted":
          await handleSubscriptionDeleted(supabase, event.data.object);
          break;

        case "invoice.paid":
          await handleInvoicePaid(supabase, event.data.object);
          break;

        case "invoice.payment_failed":
          // Mark subscription as past_due
          if (event.data.object.subscription) {
            await supabase
              .from("subscriptions")
              .update({ status: "past_due", updated_at: new Date().toISOString() })
              .eq("stripe_subscription_id", event.data.object.subscription);
          }
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (err) {
      processingError = err instanceof Error ? err.message : "Processing failed";
      console.error(`Error processing ${event.type}:`, err);
    }

    // Mark event as processed
    await supabase
      .from("billing_events")
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
        error: processingError,
      })
      .eq("id", billingEvent.id);

    return new Response(
      JSON.stringify({ received: true, processed: !processingError }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
