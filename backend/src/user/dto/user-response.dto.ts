import { Exclude } from 'class-transformer';

export class UserResponseDto {
  id: string;
  email: string;
  name: string;
  nickname: string | null;
  avatarUrl: string | null;
  bio: string | null;
  role: string;
  techStack: string[];
  createdAt: Date;
  updatedAt: Date;

  @Exclude()
  password: string | null;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
