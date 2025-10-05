import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

interface SupportReplyRequest {
  message_id: string;
  admin_response: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message_id, admin_response }: SupportReplyRequest = await req.json();
    
    console.log("Processing support reply notification for message:", message_id);

    // Get support message details
    const { data: messageData, error: messageError } = await supabase
      .from('support_messages')
      .select('*')
      .eq('id', message_id)
      .single();

    if (messageError || !messageData) {
      console.error("Error fetching support message:", messageError);
      return new Response(JSON.stringify({ error: "Support message not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Construct recipient email from country code and phone number
    const recipientEmail = messageData.user_id 
      ? (await supabase.from('profiles').select('email').eq('user_id', messageData.user_id).single()).data?.email
      : null;

    // If no user email, we can't send notification
    if (!recipientEmail) {
      console.log("No email found for support message sender");
      return new Response(JSON.stringify({ 
        success: true, 
        skipped: true,
        reason: "No email address available for sender" 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const recipientName = messageData.sender_name || 'User';

    // Send email notification
    const emailResponse = await resend.emails.send({
      from: "flat2study Support <support@flat2study.com>",
      to: [recipientEmail],
      subject: `Reply to your support message on flat2study`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Support Reply from flat2study</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
              Hello ${recipientName},
            </p>
            
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
              Thank you for contacting flat2study support. We have reviewed your message and have a response for you.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #999;">
              <h3 style="margin-top: 0; color: #333;">Your Message:</h3>
              <p style="background: #f8f9fa; padding: 15px; border-radius: 4px; margin: 5px 0; font-style: italic;">
                "${messageData.message}"
              </p>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h3 style="margin-top: 0; color: #333;">Our Response:</h3>
              <p style="background: #f0f4ff; padding: 15px; border-radius: 4px; margin: 5px 0; white-space: pre-wrap;">
                ${admin_response}
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://flat2study.com" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 12px 30px; 
                        text-decoration: none; 
                        border-radius: 6px; 
                        font-weight: bold;
                        display: inline-block;">
                Visit flat2study
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              If you have any further questions, feel free to reach out to us again.
            </p>
            
            <p style="font-size: 14px; color: #666; margin-top: 20px;">
              Best regards,<br>
              The flat2study Support Team
            </p>
          </div>
        </div>
      `,
    });

    console.log("Support reply email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, email_sent: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in send-support-reply-notification function:", error);
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
