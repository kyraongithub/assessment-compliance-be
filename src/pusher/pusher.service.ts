import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Pusher from 'pusher';

@Injectable()
export class PusherService {
  private readonly pusher: Pusher;
  private readonly logger = new Logger(PusherService.name);

  constructor(private configService: ConfigService) {
    this.pusher = new Pusher({
      appId: configService.get<string>('PUSHER_APP_ID'),
      key: configService.get<string>('PUSHER_KEY'),
      secret: configService.get<string>('PUSHER_SECRET'),
      cluster: configService.get<string>('PUSHER_CLUSTER'),
      useTLS: true,
    });
  }

  async trigger(channel: string, event: string, data: object): Promise<void> {
    try {
      await this.pusher.trigger(channel, event, data);
      this.logger.log(`Pusher event sent: [${channel}] ${event}`);
    } catch (error) {
      this.logger.error(`Pusher trigger failed: ${error.message}`);
    }
  }
}
