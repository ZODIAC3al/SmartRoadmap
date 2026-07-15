import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CalendarEvent } from '../../schemas/calendar-event.schema';
import { User } from '../../schemas/user.schema';
import { Roadmap } from '../../schemas/roadmap.schema';

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);

  constructor(
    @InjectModel(CalendarEvent.name)
    private readonly eventModel: Model<CalendarEvent>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    @InjectModel(Roadmap.name)
    private readonly roadmapModel: Model<Roadmap>,
  ) {}

  async create(userId: string, data: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const event = new this.eventModel({
      ...data,
      userId: new Types.ObjectId(userId),
    });
    return event.save();
  }

  async findAllForUser(userId: string): Promise<CalendarEvent[]> {
    return this.eventModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ startAt: 1 })
      .exec();
  }

  async update(id: string, userId: string, data: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const updated = await this.eventModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) },
      { $set: data },
      { new: true },
    );
    if (!updated) {
      throw new NotFoundException('Calendar event not found');
    }
    return updated;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const res = await this.eventModel.deleteOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });
    return res.deletedCount > 0;
  }

  async autoSchedule(userId: string): Promise<CalendarEvent[]> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const roadmap = await this.roadmapModel.findOne({
      userId: new Types.ObjectId(userId),
      status: 'active',
    });
    if (!roadmap) throw new NotFoundException('No active roadmap found for user');

    // Extract user availability, fallback to 18:00 - 20:00 weekdays if empty
    const availability = user.studyAvailability && user.studyAvailability.length > 0
      ? user.studyAvailability
      : [1, 2, 3, 4, 5].flatMap((day) => [
          { dayOfWeek: day, startHour: 18, endHour: 20 },
        ]);

    // Find all incomplete modules
    const incompleteModules = roadmap.modules.filter((m) => m.status !== 'completed');
    if (incompleteModules.length === 0) return [];

    // Wipe any existing auto-scheduled future events to prevent doubles
    const now = new Date();
    await this.eventModel.deleteMany({
      userId: new Types.ObjectId(userId),
      type: 'study_session',
      startAt: { $gte: now },
    });

    const scheduledEvents: CalendarEvent[] = [];
    let currentDay = new Date(now);
    currentDay.setDate(currentDay.getDate() + 1); // Start tomorrow

    for (const module of incompleteModules) {
      let hoursNeeded = module.estimatedHours || 5;

      while (hoursNeeded > 0) {
        const dayOfWeek = currentDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const availableSlots = availability.filter((a) => a.dayOfWeek === dayOfWeek);

        for (const slot of availableSlots) {
          if (hoursNeeded <= 0) break;

          const slotDuration = slot.endHour - slot.startHour;
          const sessionHours = Math.min(hoursNeeded, slotDuration);

          const startAt = new Date(currentDay);
          startAt.setHours(slot.startHour, 0, 0, 0);

          const endAt = new Date(currentDay);
          endAt.setHours(slot.startHour + sessionHours, 0, 0, 0);

          const event = new this.eventModel({
            userId: new Types.ObjectId(userId),
            title: `Learn Module: ${module.title}`,
            type: 'study_session',
            moduleId: module.id,
            startAt,
            endAt,
            completed: false,
          });

          await event.save();
          scheduledEvents.push(event);
          hoursNeeded -= sessionHours;
        }

        // Advance to next day
        currentDay = new Date(currentDay);
        currentDay.setDate(currentDay.getDate() + 1);
        
        // Safety lock: don't schedule more than 90 days out
        const diffDays = Math.ceil((currentDay.getTime() - now.getTime()) / (1000 * 3600 * 24));
        if (diffDays > 90) break;
      }
    }

    return scheduledEvents;
  }
}
