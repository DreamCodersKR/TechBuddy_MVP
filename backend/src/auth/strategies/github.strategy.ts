import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-github2';
import { ConfigService } from '@nestjs/config';

export interface GitHubProfile {
  provider: 'github';
  providerId: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get<string>('GITHUB_CLIENT_ID') || '',
      clientSecret: configService.get<string>('GITHUB_CLIENT_SECRET') || '',
      callbackURL: configService.get<string>('GITHUB_CALLBACK_URL') || '',
      scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (err: Error | null, user?: GitHubProfile) => void,
  ): Promise<void> {
    const { id, displayName, username, emails, photos } = profile;

    const githubProfile: GitHubProfile = {
      provider: 'github',
      providerId: id,
      email: emails?.[0]?.value || '',
      name: displayName || username || '',
      avatarUrl: photos?.[0]?.value,
    };

    done(null, githubProfile);
  }
}
