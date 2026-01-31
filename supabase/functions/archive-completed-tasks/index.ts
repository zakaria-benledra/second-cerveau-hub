import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Archive tasks that have been completed for more than 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: tasksToArchive, error: fetchError } = await supabase
      .from("tasks")
      .select("id, title, user_id")
      .eq("status", "done")
      .is("archived_at", null)
      .not("completed_at", "is", null)
      .lt("completed_at", sevenDaysAgo.toISOString());

    if (fetchError) {
      throw fetchError;
    }

    if (!tasksToArchive || tasksToArchive.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No tasks to archive", 
          archived_count: 0 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const taskIds = tasksToArchive.map((t) => t.id);

    const { error: updateError } = await supabase
      .from("tasks")
      .update({ archived_at: new Date().toISOString() })
      .in("id", taskIds);

    if (updateError) {
      throw updateError;
    }

    // Log the archive event in task_events
    const events = tasksToArchive.map((task) => ({
      task_id: task.id,
      user_id: task.user_id,
      event_type: "archived",
      payload: { reason: "weekly_auto_archive" },
    }));

    await supabase.from("task_events").insert(events);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Archived ${taskIds.length} completed tasks`,
        archived_count: taskIds.length,
        archived_task_ids: taskIds,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error archiving tasks:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
