import { Controller, Post, Get, Body, Headers, UnauthorizedException, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body('email') email: string,
    @Body('name') name: string,
    @Body('password') password: string,
    @Body('role') role: 'learner' | 'company',
  ) {
    return this.authService.register(email, name, password, role);
  }

  @Post('login')
  async login(
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    return this.authService.login(email, password);
  }

  @Post('google')
  async googleLogin(
    @Body('email') email: string,
    @Body('name') name: string,
    @Body('avatarUrl') avatarUrl?: string,
  ) {
    return this.authService.googleLogin(email, name, avatarUrl);
  }

  @Post('update-profile')
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @Body('userId') userId: string,
    @Body('data') data: any,
  ) {
    const updated = await this.authService.updateProfile(userId, data);
    return { success: true, user: updated };
  }

  @Get('me')
  async getMe(@Headers('authorization') authHeader?: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No authorization token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = this.authService.verifyToken(token);
    
    if (!decoded) {
      throw new UnauthorizedException('Invalid or expired authentication token');
    }

    const user = await this.authService.findUserById(decoded.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatarUrl,
      username: user.username,
      phone: user.phone,
      bio: user.bio,
    };
  }

  @Get('users')
  async getAllUsers() {
    const users = await this.authService.findAllUsers();
    return {
      success: true,
      data: users.map(u => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        role: u.role,
        avatarUrl: u.avatarUrl,
      })),
    };
  }
}
