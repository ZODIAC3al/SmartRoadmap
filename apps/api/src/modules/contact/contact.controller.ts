import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ContactService } from './contact.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Public()
  @Post('submit')
  @HttpCode(HttpStatus.OK)
  async submitContact(
    @Body()
    body: {
      name: string;
      email: string;
      phone?: string;
      interest?: string;
      message: string;
    },
  ) {
    await this.contactService.submit(body);
    return {
      success: true,
      message: 'Your message has been submitted successfully.',
    };
  }
}
