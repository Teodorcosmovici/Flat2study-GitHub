import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Checking for messages that need reminder notifications...");
    
    // Find messages from students that haven't been replied to in 24 hours
    const { data: unrespondedMessages, error: messagesError } = await supabase
      .from('messages')
      .select(`
        id,
        message,
        sender_name,
        sender_phone,
        sender_university,
        created_at,
        listing_id,
        agency_id,
        sender_id,
        listings:listing_id (
          title,
          address_line,
          city,
          rent_monthly_eur
        )
      `)
      .eq('replied_at', null) // No reply yet
      .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Older than 24 hours
      .gte('created_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()) // But not older than 48 hours (to avoid spam)
      .is('reminder_sent_at', null); // Haven't sent reminder yet

    if (messagesError) {
      console.error("Error fetching unresponded messages:", messagesError);
      throw messagesError;
    }

    console.log(`Found ${unrespondedMessages?.length || 0} messages needing reminders`);

    if (!unrespondedMessages || unrespondedMessages.length === 0) {
      return new Response(JSON.stringify({ success: true, reminders_sent: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    let remindersSent = 0;

    // Process each message that needs a reminder
    for (const message of unrespondedMessages) {
      try {
        // Get agency profile
        const { data: agencyProfile, error: agencyError } = await supabase
          .from('profiles')
          .select('id, agency_name, email, full_name, user_type')
          .eq('id', message.agency_id)
          .single();

        if (agencyError || !agencyProfile?.email) {
          console.log(`No email found for agency ${message.agency_id}, skipping reminder`);
          continue;
        }

        const { listings: listing } = message;
        const agencyName = agencyProfile.agency_name || agencyProfile.full_name || 'Agency';

        // Send reminder email
        const emailResponse = await resend.emails.send({
          from: "flat2study <notifications@flat2study.com>",
          to: [agencyProfile.email],
          subject: `⏰ Reminder: Unanswered message about ${listing.title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #ff9f43 0%, #ff6b35 100%); padding: 20px; border-radius: 8px 8px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">⏰ Reminder: Unanswered Message</h1>
              </div>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px;">
                <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
                  Hello ${agencyName},
                </p>
                
                <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
                  You have an <strong>unanswered message</strong> from 24 hours ago on flat2study. A potential tenant is waiting for your response!
                </p>
                
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9f43;">
                  <h3 style="margin-top: 0; color: #333;">Listing Details:</h3>
                  <p style="margin: 5px 0;"><strong>Property:</strong> ${listing.title}</p>
                  <p style="margin: 5px 0;"><strong>Location:</strong> ${listing.address_line}, ${listing.city}</p>
                  <p style="margin: 5px 0;"><strong>Rent:</strong> €${listing.rent_monthly_eur}/month</p>
                </div>
                
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
                  <h3 style="margin-top: 0; color: #333;">Original Message from ${message.sender_name}:</h3>
                  <p style="margin: 5px 0;"><strong>From:</strong> ${message.sender_name}</p>
                  ${message.sender_phone ? `<p style="margin: 5px 0;"><strong>Phone:</strong> ${message.sender_phone}</p>` : ''}
                  ${message.sender_university ? `<p style="margin: 5px 0;"><strong>University:</strong> ${message.sender_university}</p>` : ''}
                  <p style="margin: 5px 0;"><strong>Sent:</strong> ${new Date(message.created_at).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</p>
                  <p style="margin: 15px 0 5px 0;"><strong>Message:</strong></p>
                  <p style="background: #f8f9fa; padding: 15px; border-radius: 4px; margin: 5px 0; font-style: italic;">
                    "${message.message}"
                  </p>
                </div>
                
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; color: #856404; font-weight: bold;">
                    💡 Quick response tip: Responding promptly increases your chances of securing quality tenants!
                  </p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://flat2study.com/messages" 
                     style="background: linear-gradient(135deg, #ff9f43 0%, #ff6b35 100%); 
                            color: white; 
                            padding: 12px 30px; 
                            text-decoration: none; 
                            border-radius: 6px; 
                            font-weight: bold;
                            display: inline-block;">
                    Reply Now on flat2study
                  </a>
                </div>
                
                <p style="font-size: 14px; color: #666; margin-top: 30px;">
                  Best regards,<br>
                  The flat2study Team
                </p>
                
                <p style="font-size: 12px; color: #999; margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px;">
                  This is a reminder for an unanswered message. You will only receive one reminder per message.
                </p>
              </div>
            </div>
          `,
        });

        console.log(`Reminder sent to ${agencyProfile.email} for message ${message.id}`);

        // Mark the message as having received a reminder
        const { error: updateError } = await supabase
          .from('messages')
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq('id', message.id);

        if (updateError) {
          console.error(`Error updating reminder status for message ${message.id}:`, updateError);
        } else {
          remindersSent++;
        }

      } catch (error) {
        console.error(`Error sending reminder for message ${message.id}:`, error);
      }
    }

    console.log(`Successfully sent ${remindersSent} reminder notifications`);

    return new Response(JSON.stringify({ 
      success: true, 
      reminders_sent: remindersSent,
      total_checked: unrespondedMessages.length 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in send-reminder-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);