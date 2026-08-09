import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { LinkedInAuthController } from './linkedin-auth.controller';
import { AuthService } from './auth.service';
import { OnboardingService } from './onboarding.service';
import { User, UserSchema } from '../../schemas/user.schema';
import { ProfileImportModule } from '../profile-import/profile-import.module';

@Global()
@Module({
  imports: [
    JwtModule.register({}), // secrets are passed per-operation (access vs refresh)
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    ProfileImportModule,
  ],
  controllers: [AuthController, LinkedInAuthController],
  providers: [AuthService, OnboardingService],
  exports: [AuthService, JwtModule, MongooseModule],
})
export class AuthModule {}
