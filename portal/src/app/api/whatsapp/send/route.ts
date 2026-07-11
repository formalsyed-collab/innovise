import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;

// POST: Admins reply to a WhatsApp conversation
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    // Validate Admin session using standard client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
        },
      }
    );

    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
    }

    const { conversation_id, message } = await req.json();

    if (!conversation_id || !message) {
      return NextResponse.json({ error: "conversation_id and message are required" }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Get the conversation to find the phone number
    const { data: conversation, error: convError } = await adminClient
      .from("whatsapp_conversations")
      .select("phone_number, status")
      .eq("id", conversation_id)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Update conversation status to active human if not already
    if (conversation.status !== "human_active") {
        await adminClient
          .from("whatsapp_conversations")
          .update({ status: "human_active", updated_at: new Date().toISOString() })
          .eq("id", conversation_id);
    }

    // Send the message via WhatsApp API
    if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_ID) {
        console.warn("Missing WhatsApp credentials. Would have sent:", message);
    } else {
        const response = await fetch(
            `https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_ID}/messages`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                messaging_product: "whatsapp",
                to: conversation.phone_number,
                type: "text",
                text: { body: message },
              }),
            }
          );
      
          if (!response.ok) {
            const errorData = await response.json();
            console.error("WhatsApp API Error:", errorData);
            return NextResponse.json({ error: "Failed to send message to WhatsApp" }, { status: 500 });
          }
    }

    // Save the message to the DB
    const { data: insertedMsg, error: insertError } = await adminClient
      .from("whatsapp_messages")
      .insert({
        conversation_id,
        sender: "admin",
        content: message,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error saving admin message:", insertError);
      return NextResponse.json({ error: "Failed to save message in database" }, { status: 500 });
    }

    return NextResponse.json({ status: "ok", message: insertedMsg }, { status: 200 });
  } catch (error) {
    console.error("Send Message Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
