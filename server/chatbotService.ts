import OpenAI from 'openai';
import { db } from './db';
import { 
  chatbotConfigs, 
  calendarIntegrations, 
  appointmentServices, 
  appointments, 
  chatbotConversations,
  messages,
  type ChatbotConfig,
  type CalendarIntegration,
  type AppointmentService,
  type Appointment
} from '@shared/schema';
import { eq, and } from 'drizzle-orm';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ChatbotResponse {
  message: string;
  action?: 'schedule_appointment' | 'qualify_lead' | 'handoff_to_human' | 'ask_question';
  actionData?: any;
  leadScore?: number;
  confidence?: number;
}

export interface SchedulingIntent {
  serviceType?: string;
  preferredTime?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  additionalInfo?: string;
}

export class ChatbotService {
  private async getChatbotConfig(brandId: string): Promise<ChatbotConfig | null> {
    const [config] = await db
      .select()
      .from(chatbotConfigs)
      .where(eq(chatbotConfigs.brandId, brandId))
      .limit(1);
    
    return config || null;
  }

  private async getCalendarIntegration(brandId: string): Promise<CalendarIntegration | null> {
    const [integration] = await db
      .select()
      .from(calendarIntegrations)
      .where(and(
        eq(calendarIntegrations.brandId, brandId),
        eq(calendarIntegrations.isActive, true)
      ))
      .limit(1);
    
    return integration || null;
  }

  private async getAvailableServices(brandId: string): Promise<AppointmentService[]> {
    return await db
      .select()
      .from(appointmentServices)
      .where(and(
        eq(appointmentServices.brandId, brandId),
        eq(appointmentServices.isActive, true)
      ));
  }

  async generateResponse(
    messageContent: string,
    brandId: string,
    customerIdentifier: string,
    platform: string,
    conversationHistory: string[] = []
  ): Promise<ChatbotResponse> {
    try {
      // Get chatbot configuration
      const config = await this.getChatbotConfig(brandId);
      if (!config) {
        return {
          message: "I'm sorry, I'm not configured yet. Please contact our team directly.",
          confidence: 0
        };
      }

      // Get calendar integration and services
      const calendarIntegration = await this.getCalendarIntegration(brandId);
      const services = await this.getAvailableServices(brandId);

      // Build context for AI
      const systemPrompt = this.buildSystemPrompt(config, calendarIntegration, services);
      const conversationContext = conversationHistory.join('\n');

      // Generate AI response
      const completion = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Conversation history:\n${conversationContext}\n\nCustomer message: ${messageContent}` }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 1000
      });

      const aiResponse = JSON.parse(completion.choices[0].message.content || '{}');
      
      return {
        message: aiResponse.message || "I'm sorry, I didn't understand that. Can you please rephrase?",
        action: aiResponse.action,
        actionData: aiResponse.actionData,
        leadScore: aiResponse.leadScore || 0,
        confidence: aiResponse.confidence || 0.8
      };

    } catch (error) {
      console.error('Chatbot AI error:', error);
      return {
        message: "I'm having technical difficulties right now. Let me connect you with a human representative.",
        action: 'handoff_to_human',
        confidence: 0
      };
    }
  }

  private buildSystemPrompt(
    config: ChatbotConfig,
    calendarIntegration: CalendarIntegration | null,
    services: AppointmentService[]
  ): string {
    const servicesText = services.length > 0 
      ? services.map(s => `- ${s.name}: ${s.duration} minutes, $${(s.price || 0) / 100}`).join('\n')
      : 'No services configured';

    return `You are ${config.name}, an AI assistant for a ${config.industry || 'business'} company. 

PERSONALITY & TONE:
- Tone: ${config.tone}
- Language: ${config.language === 'es' ? 'Spanish' : 'English'}
- Industry: ${config.industry}
${config.specialInstructions ? `- Special instructions: ${config.specialInstructions}` : ''}

CAPABILITIES:
- Lead qualification: ${config.canQualifyLeads ? 'YES' : 'NO'}
- Appointment scheduling: ${config.canScheduleAppointments && calendarIntegration ? 'YES' : 'NO'}
- Human handoff: ${config.canHandoffToHuman ? 'YES' : 'NO'}

${services.length > 0 ? `AVAILABLE SERVICES:
${servicesText}` : ''}

${calendarIntegration ? `BUSINESS HOURS: ${JSON.stringify(calendarIntegration.businessHours || {})}
TIMEZONE: ${calendarIntegration.timezone}
ADVANCE BOOKING: ${calendarIntegration.advanceBookingDays} days` : ''}

RESPONSE FORMAT:
Always respond in JSON format with these fields:
{
  "message": "Your response to the customer",
  "action": "schedule_appointment|qualify_lead|ask_question|handoff_to_human|none",
  "actionData": {
    // For schedule_appointment: {serviceType, preferredTime, customerInfo}
    // For qualify_lead: {questions, interestedServices}
    // For ask_question: {questionType, followUp}
  },
  "leadScore": 0-100, // How qualified is this lead
  "confidence": 0.0-1.0 // How confident you are in this response
}

GUIDELINES:
1. Always be helpful and professional
2. Try to understand customer intent (booking, information, complaint, etc.)
3. If they want to schedule, ask for service type, preferred time, and contact info
4. Score leads based on buying intent, urgency, and fit for services
5. If customer seems frustrated or has complex issues, suggest human handoff
6. Keep responses concise but friendly
7. Ask one question at a time to avoid overwhelming customers

Remember: You're helping a business convert leads into appointments!`;
  }

  async processSchedulingRequest(
    schedulingData: SchedulingIntent,
    brandId: string,
    customerIdentifier: string
  ): Promise<{ success: boolean; appointmentId?: string; message: string }> {
    try {
      const calendarIntegration = await this.getCalendarIntegration(brandId);
      if (!calendarIntegration) {
        return {
          success: false,
          message: "I'm sorry, appointment scheduling isn't set up yet. Please contact us directly."
        };
      }

      // Find the service
      let selectedService: AppointmentService | undefined;
      if (schedulingData.serviceType) {
        const services = await this.getAvailableServices(brandId);
        selectedService = services.find(s => 
          s.name.toLowerCase().includes(schedulingData.serviceType!.toLowerCase())
        );
      }

      if (!selectedService) {
        return {
          success: false,
          message: "I couldn't find that service. What type of appointment would you like to schedule?"
        };
      }

      // For now, create a pending appointment that needs confirmation
      // In a full implementation, this would integrate with actual calendar APIs
      const [appointment] = await db
        .insert(appointments)
        .values({
          calendarIntegrationId: calendarIntegration.id,
          serviceId: selectedService.id,
          startTime: new Date(), // This would be calculated based on preferred time
          endTime: new Date(Date.now() + selectedService.duration * 60000),
          timezone: calendarIntegration.timezone,
          customerName: schedulingData.customerName || 'Unknown',
          customerEmail: schedulingData.customerEmail || null,
          customerPhone: schedulingData.customerPhone || null,
          status: 'scheduled'
        })
        .returning();

      return {
        success: true,
        appointmentId: appointment.id,
        message: `Great! I've scheduled your ${selectedService.name} appointment. You'll receive a confirmation shortly.`
      };

    } catch (error) {
      console.error('Scheduling error:', error);
      return {
        success: false,
        message: "I had trouble scheduling your appointment. Let me connect you with someone who can help."
      };
    }
  }

  async updateLeadScore(
    conversationId: string,
    leadScore: number,
    qualificationData: any
  ): Promise<void> {
    try {
      await db
        .update(chatbotConversations)
        .set({
          leadScore,
          qualificationData,
          lastActivityAt: new Date()
        })
        .where(eq(chatbotConversations.id, conversationId));
    } catch (error) {
      console.error('Error updating lead score:', error);
    }
  }

  async createOrUpdateConversation(
    brandId: string,
    messageId: string,
    customerIdentifier: string,
    platform: string
  ): Promise<string> {
    try {
      // Try to find existing conversation
      const [existing] = await db
        .select()
        .from(chatbotConversations)
        .where(and(
          eq(chatbotConversations.customerIdentifier, customerIdentifier),
          eq(chatbotConversations.platform, platform),
          eq(chatbotConversations.status, 'active')
        ))
        .limit(1);

      if (existing) {
        // Update last activity
        await db
          .update(chatbotConversations)
          .set({ lastActivityAt: new Date() })
          .where(eq(chatbotConversations.id, existing.id));
        
        return existing.id;
      }

      // Create new conversation
      const [chatbotConfig] = await db
        .select()
        .from(chatbotConfigs)
        .where(eq(chatbotConfigs.brandId, brandId))
        .limit(1);

      if (!chatbotConfig) {
        throw new Error('No chatbot config found');
      }

      const [conversation] = await db
        .insert(chatbotConversations)
        .values({
          chatbotConfigId: chatbotConfig.id,
          messageId,
          customerIdentifier,
          platform,
          status: 'active'
        })
        .returning();

      return conversation.id;

    } catch (error) {
      console.error('Error creating/updating conversation:', error);
      throw error;
    }
  }

  // Calendar integration methods (will be expanded)
  async getAvailableTimeSlots(
    brandId: string,
    serviceId: string,
    date: string
  ): Promise<string[]> {
    // This would integrate with actual calendar APIs
    // For now, return mock available times
    return [
      '09:00 AM',
      '10:30 AM',
      '02:00 PM',
      '03:30 PM',
      '04:00 PM'
    ];
  }

  async sendAppointmentConfirmation(appointmentId: string): Promise<void> {
    // This would send SMS/email confirmations
    // Integration with services like Twilio, SendGrid, etc.
    console.log(`Would send confirmation for appointment ${appointmentId}`);
  }
}

export const chatbotService = new ChatbotService();