import { Injectable, Logger } from "@nestjs/common";
import { Expo, ExpoPushMessage } from "expo-server-sdk";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly expo = new Expo();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Send a notification to every registered device of the given user.
   * Silently drops invalid/expired tokens so callers don't need to handle them.
   */
  async sendToUser(
    userId: string,
    payload: { title: string; body: string; data?: Record<string, unknown> },
  ): Promise<void> {
    const tokens = await this.prisma.pushToken.findMany({
      where: { userId },
      select: { token: true },
    });
    if (tokens.length === 0) return;

    const messages: ExpoPushMessage[] = [];
    const invalid: string[] = [];
    for (const { token } of tokens) {
      if (!Expo.isExpoPushToken(token)) {
        invalid.push(token);
        continue;
      }
      messages.push({
        to: token,
        sound: "default",
        title: payload.title,
        body: payload.body,
        data: payload.data ?? {},
      });
    }
    if (invalid.length > 0) {
      await this.prisma.pushToken.deleteMany({ where: { token: { in: invalid } } });
    }
    if (messages.length === 0) return;

    const chunks = this.expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      try {
        const tickets = await this.expo.sendPushNotificationsAsync(chunk);
        // Clean up tokens Expo reports as DeviceNotRegistered.
        const toDelete: string[] = [];
        tickets.forEach((ticket, idx) => {
          if (
            ticket.status === "error" &&
            ticket.details?.error === "DeviceNotRegistered"
          ) {
            toDelete.push(chunk[idx].to as string);
          }
        });
        if (toDelete.length > 0) {
          await this.prisma.pushToken.deleteMany({
            where: { token: { in: toDelete } },
          });
        }
      } catch (err) {
        this.logger.warn(`Expo push chunk failed: ${(err as Error).message}`);
      }
    }
  }

  async sendToUsers(
    userIds: string[],
    payload: { title: string; body: string; data?: Record<string, unknown> },
  ): Promise<void> {
    await Promise.all(userIds.map((id) => this.sendToUser(id, payload)));
  }
}
