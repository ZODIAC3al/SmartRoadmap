import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OnboardingService } from './onboarding.service';
import { User, UserSchema } from '../../schemas/user.schema';

@Global()
@Module({
  imports: [
    JwtModule.register({}), // secrets are passed per-operation (access vs refresh)
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [AuthController],
  providers: [AuthService, OnboardingService],
  exports: [AuthService, JwtModule, MongooseModule],
})
export class AuthModule {}
