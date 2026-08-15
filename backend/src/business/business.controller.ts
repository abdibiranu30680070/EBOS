import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { BusinessService } from './business.service';

@Controller('api/v1/business')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Post('register')
  async register(@Body() body: any) {
    if (!body.businessName || !body.ownerName || !body.username || !body.password) {
      throw new BadRequestException('Business name, owner name, username, and password are required.');
    }
    
    return this.businessService.registerBusiness(body);
  }
}
