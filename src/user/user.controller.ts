import { Controller, Get, Put, Param, Body } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // GET /user/:phone
  @Get(':phone')
  async getUser(@Param('phone') phone: string) {
    const data = await this.userService.findByPhone(`+91${phone}`);
    console.log(data);
    return data;
  }

  // PUT /user/:phone
  @Put(':phone')
  updateUser(
    @Param('phone') phone: string,
    @Body() payload: any
  ) {
    return this.userService.createOrUpdate(`+91${phone}`, payload);
  }

  @Get('aggregate')
  async aggregate() {
    await this.userService.aggregateUserBehaviour();
    return 'done';
  }
}
