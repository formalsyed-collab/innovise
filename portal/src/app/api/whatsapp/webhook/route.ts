import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/server";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "innovise_whatsapp_secret";
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;

// GET: Webhook verification by Meta
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("WEBHOOK_VERIFIED");
    return new NextResponse(challenge, { status: 200 });
  } else {
    return NextResponse.json({ error: "Verification failed" }, { status: 403 });
  }
}

// POST: Handle incoming WhatsApp messages
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.object) {
      if (
        body.entry &&
        body.entry[0].changes &&
        body.entry[0].changes[0] &&
        body.entry[0].changes[0].value.messages &&
        body.entry[0].changes[0].value.messages[0]
      ) {
        const phoneNumberId = body.entry[0].changes[0].value.metadata.phone_number_id;
        const from = body.entry[0].changes[0].value.messages[0].from; // sender's phone number
        const msgBody = body.entry[0].changes[0].value.messages[0].text?.body?.trim();

        if (!msgBody) {
            return NextResponse.json({ status: "ignored - not text" }, { status: 200 });
        }

        const supabase = createAdminClient();

        // 1. Find or create conversation
        let { data: conversation } = await supabase
          .from("whatsapp_conversations")
          .select("*")
          .eq("phone_number", from)
          .single();

        if (!conversation) {
          // Check if profile exists with this number (basic match)
          const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("phone", from)
            .single();

          const { data: newConv, error: insertError } = await supabase
            .from("whatsapp_conversations")
            .insert({
              phone_number: from,
              profile_id: profile ? profile.id : null,
              status: "bot",
            })
            .select()
            .single();
          
          if (insertError) {
              console.error("Error creating conversation:", insertError);
          }
          conversation = newConv;
        }

        if (conversation) {
            // 2. Save the incoming message
            await supabase.from("whatsapp_messages").insert({
            conversation_id: conversation.id,
            sender: "user",
            content: msgBody,
            });

            // 3. Bot Logic
            if (conversation.status === "bot") {
            let replyText = "";
            const lowerMsg = msgBody.toLowerCase();

            if (lowerMsg.includes("human") || lowerMsg.includes("agent") || lowerMsg.includes("support")) {
                // Hand off to human
                await supabase
                .from("whatsapp_conversations")
                .update({ status: "human_requested", updated_at: new Date().toISOString() })
                .eq("id", conversation.id);
                
                replyText = "I have connected you with our human team. Someone will review your message and reply shortly.";
            } else if (lowerMsg.includes("service") || lowerMsg.includes("pricing")) {
                replyText = "We offer a variety of consultant services, including documentation, filing, and expert advice. You can sign up on our portal at innovise.in to see detailed pricing.";
            } else {
                // Default reply
                replyText = "Hello! I am the Innovise virtual assistant. How can I help you today?\n\nType 'services' to learn what we offer.\nType 'human' to speak to a real person.";
            }

            // Send reply back to WhatsApp
            await sendWhatsAppMessage(from, replyText, phoneNumberId);

            // Save bot reply to DB
            await supabase.from("whatsapp_messages").insert({
                conversation_id: conversation.id,
                sender: "bot",
                content: replyText,
            });
            } else {
                // The status is 'human_requested' or 'human_active', so we just store the message.
                // (We could optionally notify admins here via email or dashboard notification)
                await supabase
                .from("whatsapp_conversations")
                .update({ updated_at: new Date().toISOString() })
                .eq("id", conversation.id);
            }
        }
      }
      return NextResponse.json({ status: "ok" }, { status: 200 });
    } else {
      return NextResponse.json({ error: "Not a WhatsApp API event" }, { status: 404 });
    }
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

async function sendWhatsAppMessage(to: string, body: string, phoneNumberId: string) {
  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_ID) {
    console.log("Missing WhatsApp credentials. Would have sent:", body);
    return;
  }
  
  // fallback to env phone id if the webhook doesn't provide it
  const phoneId = phoneNumberId || WHATSAPP_PHONE_ID;

  try {
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${phoneId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: to,
          type: "text",
          text: { body: body },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("WhatsApp API Error:", errorData);
    }
  } catch (err) {
    console.error("Failed to send WhatsApp message:", err);
  }
}
