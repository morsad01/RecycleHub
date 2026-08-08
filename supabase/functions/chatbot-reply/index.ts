import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_PROMPT = `You are the ResellBD assistant, a helpful support chatbot for an AI-powered second-hand resale marketplace. Your knowledge is scoped to:
- How to buy and sell items on ResellBD
- How AI features work (image analysis, price suggestions, condition assessment, fake detection)
- How to become a verified seller
- How messaging, orders, and delivery work
- Safety guidelines and best practices
- Account and profile management

Keep responses concise and friendly. If a user asks something outside your scope, politely redirect them to the relevant ResellBD feature or suggest contacting support@resellbd.bd for human assistance. Never provide pricing advice for specific items outside the platform.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { message, userId } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: "No message provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("AI_API_KEY");

    // Graceful degradation
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          reply: "AI assistant is currently unavailable. Please try again later or contact support@resellbd.bd for help.",
          fallback: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for escalation keywords
    const lowerMsg = message.toLowerCase();
    if (lowerMsg.includes("human") || lowerMsg.includes("agent") || lowerMsg.includes("support person")) {
      return new Response(
        JSON.stringify({
          reply: "I'll connect you with a human support agent. In the meantime, you can email support@resellbd.bd and our team will get back to you within 24 hours.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: message },
        ],
        max_tokens: 250,
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API returned ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content ?? "Sorry, I couldn't process that. Please try again.";

    // Persist chatbot messages to the database
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (supabaseUrl && serviceKey && userId) {
        await fetch(`${supabaseUrl}/rest/v1/chatbot_messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": serviceKey,
            "Authorization": `Bearer ${serviceKey}`,
          },
          body: JSON.stringify([
            { user_id: userId, role: "user", content: message },
            { user_id: userId, role: "assistant", content: reply },
          ]),
        });
      }
    } catch {
      // Persistence failure is non-fatal
    }

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        reply: "I'm having trouble responding right now. Please try again later or contact support@resellbd.bd",
        error: err.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
