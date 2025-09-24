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

// In-memory set to track recently processed messages (prevents duplicates)
const processedMessages = new Set<string>();

interface MessageNotificationRequest {
  message_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message_id }: MessageNotificationRequest = await req.json();
    
    // Check if we've already processed this message recently
    if (processedMessages.has(message_id)) {
      console.log("Duplicate notification request for message:", message_id, "- skipping");
      return new Response(JSON.stringify({ success: true, skipped: true, reason: "duplicate" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    
    // Mark message as being processed
    processedMessages.add(message_id);
    
    // Clean up old entries after 5 minutes to prevent memory leaks
    setTimeout(() => {
      processedMessages.delete(message_id);
    }, 5 * 60 * 1000);
    
    console.log("Processing notification for message:", message_id);

    // Get message details with listing and agency profile
    const { data: messageData, error: messageError } = await supabase
      .from('messages')
      .select(`
        *,
        listings:listing_id (
          title,
          address_line,
          city,
          rent_monthly_eur,
          images
        )
      `)
      .eq('id', message_id)
      .single();

    if (messageError || !messageData) {
      console.error("Error fetching message:", messageError);
      return new Response(JSON.stringify({ error: "Message not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get agency profile separately
    const { data: agencyProfile, error: agencyError } = await supabase
      .from('profiles')
      .select('id, agency_name, email, full_name, user_type')
      .eq('id', messageData.agency_id)
      .single();

    // Get sender profile separately  
    const { data: senderProfile, error: senderError } = await supabase
      .from('profiles')
      .select('id, full_name, email, user_type, university')
      .eq('user_id', messageData.sender_id)
      .single();

    const { listings: listing } = messageData;
    
    // Determine who should receive the notification
    let recipientEmail = '';
    let recipientName = '';
    let senderName = '';
    let isAgencyToStudent = false;
    
    if (senderProfile?.user_type === 'agency') {
      // Agency sent message to student, notify the student
      // Extract student ID from conversation_id field
      let studentId: string | null = null;
      
      console.log('Processing agency message, conversation_id:', messageData.conversation_id);
      
      if (messageData.conversation_id) {
        // Parse conversation_id format: "listing-{listing_id}-student-{student_id}"
        // Need to handle UUIDs which contain hyphens
        const studentKeywordIndex = messageData.conversation_id.indexOf('-student-');
        console.log('Student keyword index:', studentKeywordIndex);
        
        if (studentKeywordIndex !== -1) {
          // Extract everything after "-student-"
          studentId = messageData.conversation_id.substring(studentKeywordIndex + 9);
          console.log('Extracted student ID:', studentId);
        }
      }
      
      if (!studentId) {
        console.log('Could not extract student ID from conversation_id:', messageData.conversation_id);
        return new Response(JSON.stringify({ 
          error: 'Could not determine recipient student',
          conversation_id: messageData.conversation_id,
          conversation_id_parts: messageData.conversation_id?.split('-') || null
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
      
      console.log('Fetching student profile for ID:', studentId);
      
      // Get the student profile
      const { data: studentProfile, error: studentError } = await supabase
        .from('profiles')
        .select('email, full_name, user_type')
        .eq('user_id', studentId)
        .eq('user_type', 'student')
        .single();
      
      console.log('Student profile result:', { studentProfile, studentError });
          
      if (studentProfile?.email) {
        recipientEmail = studentProfile.email;
        recipientName = studentProfile.full_name || 'Student';
        senderName = agencyProfile?.agency_name || agencyProfile?.full_name || 'Agency';
        isAgencyToStudent = true;
        console.log('Setting up email for agency->student:', { recipientEmail, recipientName, senderName });
      } else {
        console.log('No email found for student or student not found');
        return new Response(JSON.stringify({ 
          error: 'Student email not found',
          studentId: studentId,
          studentProfile: studentProfile 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    } else {
      // Student sent message to agency, notify the agency (original behavior)
      if (agencyProfile?.email) {
        recipientEmail = agencyProfile.email;
        recipientName = agencyProfile.agency_name || agencyProfile.full_name || 'Agency';
        senderName = messageData.sender_name;
        isAgencyToStudent = false;
      }
    }
    
    if (!recipientEmail) {
      console.log("No recipient email found, skipping notification");
      return new Response(JSON.stringify({ success: true, skipped: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Send email notification with appropriate template
    const emailResponse = await resend.emails.send({
      from: "flat2study <notifications@flat2study.com>",
      to: [recipientEmail],
      subject: isAgencyToStudent 
        ? `Reply from ${senderName} about listing: ${listing.title}`
        : `New message about your listing: ${listing.title}`,
      html: isAgencyToStudent ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">New Reply on flat2study</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
              Hello ${recipientName},
            </p>
            
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
              You have received a reply from <strong>${senderName}</strong> about your inquiry on flat2study!
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h3 style="margin-top: 0; color: #333;">Listing Details:</h3>
              <p style="margin: 5px 0;"><strong>Property:</strong> ${listing.title}</p>
              <p style="margin: 5px 0;"><strong>Location:</strong> ${listing.address_line}, ${listing.city}</p>
              <p style="margin: 5px 0;"><strong>Rent:</strong> €${listing.rent_monthly_eur}/month</p>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
              <h3 style="margin-top: 0; color: #333;">Reply from ${senderName}:</h3>
              <p style="background: #f8f9fa; padding: 15px; border-radius: 4px; margin: 5px 0; font-style: italic;">
                "${messageData.message}"
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://flat2study.com/messages" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 12px 30px; 
                        text-decoration: none; 
                        border-radius: 6px; 
                        font-weight: bold;
                        display: inline-block;">
                View and Reply on flat2study
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              Best regards,<br>
              The flat2study Team
            </p>
          </div>
        </div>
      ` : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">New Message on flat2study</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
              Hello ${recipientName},
            </p>
            
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
              You have received a new message about your listing on flat2study!
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h3 style="margin-top: 0; color: #333;">Listing Details:</h3>
              <p style="margin: 5px 0;"><strong>Property:</strong> ${listing.title}</p>
              <p style="margin: 5px 0;"><strong>Location:</strong> ${listing.address_line}, ${listing.city}</p>
              <p style="margin: 5px 0;"><strong>Rent:</strong> €${listing.rent_monthly_eur}/month</p>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
              <h3 style="margin-top: 0; color: #333;">Message Details:</h3>
              <p style="margin: 5px 0;"><strong>From:</strong> ${senderName}</p>
              ${messageData.sender_phone ? `<p style="margin: 5px 0;"><strong>Phone:</strong> ${messageData.sender_phone}</p>` : ''}
              ${messageData.sender_university ? `<p style="margin: 5px 0;"><strong>University:</strong> ${messageData.sender_university}</p>` : ''}
              <p style="margin: 15px 0 5px 0;"><strong>Message:</strong></p>
              <p style="background: #f8f9fa; padding: 15px; border-radius: 4px; margin: 5px 0; font-style: italic;">
                "${messageData.message}"
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://flat2study.com/messages" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 12px 30px; 
                        text-decoration: none; 
                        border-radius: 6px; 
                        font-weight: bold;
                        display: inline-block;">
                View and Reply on flat2study
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              Best regards,<br>
              The flat2study Team
            </p>
          </div>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, email_sent: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in send-message-notification function:", error);
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