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

// Initialize OpenAI client (only if API key is available)
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

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

      if (!openai) {
        return {
          message: "I'm sorry, the AI assistant is not available right now. Please contact our team directly.",
          confidence: 0
        };
      }

      // Generate AI response
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Conversation history:\n${conversationContext}\n\nCustomer message: ${messageContent}` }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 1000
      });

      const rawContent = completion.choices?.[0]?.message?.content || '{}';
      let aiResponse: any;
      try {
        aiResponse = JSON.parse(rawContent);
      } catch {
        aiResponse = { message: rawContent };
      }

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

      // Calculate start time from preferred time or default to next available
      let startTime: Date;
      if (schedulingData.preferredTime) {
        startTime = new Date(schedulingData.preferredTime);
        if (isNaN(startTime.getTime())) {
          return {
            success: false,
            message: "I couldn't understand that time. Could you provide a date and time like '2025-03-28 10:00 AM'?"
          };
        }
      } else {
        // Default to tomorrow at 10 AM in the calendar's timezone
        startTime = new Date();
        startTime.setDate(startTime.getDate() + 1);
        startTime.setHours(10, 0, 0, 0);
      }

      const endTime = new Date(startTime.getTime() + selectedService.duration * 60000);

      const [appointment] = await db
        .insert(appointments)
        .values({
          calendarIntegrationId: calendarIntegration.id,
          serviceId: selectedService.id,
          startTime,
          endTime,
          timezone: calendarIntegration.timezone || 'America/New_York',
          customerName: schedulingData.customerName || 'Unknown',
          customerEmail: schedulingData.customerEmail || null,
          customerPhone: schedulingData.customerPhone || null,
          status: 'scheduled'
        } as any)
        .returning();

      // Mark as confirmed
      await this.sendAppointmentConfirmation(appointment.id);

      const timeStr = startTime.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
      return {
        success: true,
        appointmentId: appointment.id,
        message: `Great! I've scheduled your ${selectedService.name} appointment for ${timeStr}. It's been confirmed.`
      };

    } catch (error) {
      console.error('[ChatbotService] Scheduling error:', error);
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

  // Calendar integration methods
  async getAvailableTimeSlots(
    brandId: string,
    serviceId: string,
    date: string
  ): Promise<string[]> {
    const calIntegration = await this.getCalendarIntegration(brandId);
    if (!calIntegration) return [];

    // Get the service to know its duration
    const services = await this.getAvailableServices(brandId);
    const service = services.find(s => s.id === serviceId);
    const duration = service?.duration || 30;

    // Get business hours for the given day
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'lowercase' as any })
      || ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][new Date(date).getDay()];
    const businessHours = calIntegration.businessHours as Record<string, { start?: string; end?: string; enabled?: boolean }> | null;
    const dayHours = businessHours?.[dayOfWeek];
    if (!dayHours || dayHours.enabled === false || !dayHours.start || !dayHours.end) return [];

    // Parse business hours
    const [startH, startM] = dayHours.start.split(':').map(Number);
    const [endH, endM] = dayHours.end.split(':').map(Number);
    const bufferTime = calIntegration.bufferTime || 15;

    // Get existing appointments for that date
    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(date);
    dateEnd.setHours(23, 59, 59, 999);

    const { gte, lte } = await import('drizzle-orm');
    const existingAppointments = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.calendarIntegrationId, calIntegration.id),
          gte(appointments.startTime, dateStart),
          lte(appointments.startTime, dateEnd)
        )
      );

    // Generate available slots
    const slots: string[] = [];
    let currentMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    while (currentMinutes + duration <= endMinutes) {
      const slotStart = new Date(date);
      slotStart.setHours(Math.floor(currentMinutes / 60), currentMinutes % 60, 0, 0);
      const slotEnd = new Date(slotStart.getTime() + duration * 60000);

      // Check for conflicts with existing appointments
      const hasConflict = existingAppointments.some(apt => {
        const aptStart = new Date(apt.startTime).getTime();
        const aptEnd = new Date(apt.endTime).getTime();
        return slotStart.getTime() < aptEnd && slotEnd.getTime() > aptStart;
      });

      if (!hasConflict) {
        const hours = Math.floor(currentMinutes / 60);
        const mins = currentMinutes % 60;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
        slots.push(`${displayHours}:${mins.toString().padStart(2, '0')} ${ampm}`);
      }

      currentMinutes += duration + bufferTime;
    }

    return slots;
  }

  async sendAppointmentConfirmation(appointmentId: string): Promise<void> {
    // Mark the appointment as confirmed in the database
    await db
      .update(appointments)
      .set({ status: 'confirmed', confirmationSentAt: new Date() })
      .where(eq(appointments.id, appointmentId));
  }
}

export const chatbotService = new ChatbotService();