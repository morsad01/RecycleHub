import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { images } = await req.json();

    if (!images || !Array.isArray(images) || images.length === 0) {
      return new Response(
        JSON.stringify({ error: "No images provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("AI_API_KEY");

    // Graceful degradation: if no API key, return a heuristic-based fallback
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          suggested_category: null,
          condition_estimate: null,
          confidence: 0,
          is_likely_fake: false,
          risk_score: 0.1,
          risk_reasons: ["AI_API_KEY not configured — manual review recommended"],
          fallback: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call OpenAI Vision API (or compatible multimodal LLM)
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a product analysis assistant for a resale marketplace. Analyze the product image(s) and return a JSON object with: suggested_category (string, one of: Electronics, Mobile Phones, Laptops, Cameras, Furniture, Clothing, Books, Sports, Toys, Vehicles, Music, Health & Beauty), condition_estimate (string, one of: new, excellent, good, fair, poor), confidence (number 0-1), is_likely_fake (boolean), risk_score (number 0-1), risk_reasons (array of strings). Respond ONLY with valid JSON, no markdown.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this product image and return the JSON analysis." },
              ...images.slice(0, 3).map((url: string) => ({
                type: "image_url",
                image_url: { url },
              })),
            ],
          },
        ],
        max_tokens: 300,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API returned ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    let analysis;
    try {
      analysis = JSON.parse(content);
    } catch {
      // If the model didn't return valid JSON, return a safe fallback
      analysis = {
        suggested_category: null,
        condition_estimate: null,
        confidence: 0,
        is_likely_fake: false,
        risk_score: 0.2,
        risk_reasons: ["Unable to parse AI response"],
      };
    }

    return new Response(
      JSON.stringify(analysis),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err.message,
        suggested_category: null,
        condition_estimate: null,
        confidence: 0,
        is_likely_fake: false,
        risk_score: 0.1,
        risk_reasons: ["AI analysis failed — manual entry recommended"],
        fallback: true,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
