import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: ConfigService) {
    const clientID = config.get<string>('GOOGLE_CLIENT_ID') ?? process.env['GOOGLE_CLIENT_ID'];
    const clientSecret = config.get<string>('GOOGLE_CLIENT_SECRET') ?? process.env['GOOGLE_CLIENT_SECRET'];
    const callbackURL = config.get<string>('GOOGLE_CALLBACK_URL') ?? process.env['GOOGLE_CALLBACK_URL'] ?? 'http://localhost:3000/api/auth/google/callback';

    if (!clientID || !clientSecret) {
      throw new Error(`Google OAuth not configured. GOOGLE_CLIENT_ID=${clientID ? 'set' : 'MISSING'}, GOOGLE_CLIENT_SECRET=${clientSecret ? 'set' : 'MISSING'}`);
    }

    super({ clientID, clientSecret, callbackURL, scope: ['email', 'profile'] });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback) {
    const { emails, name } = profile;
    done(null, {
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
    });
  }
}
