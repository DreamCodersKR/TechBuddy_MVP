import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { BoardModule } from './board/board.module';
import { PostModule } from './post/post.module';
import { CommentModule } from './comment/comment.module';
import { LikeModule } from './like/like.module';
import { BookmarkModule } from './bookmark/bookmark.module';
import { ProjectModule } from './project/project.module';
import { SprintModule } from './sprint/sprint.module';
import { AgoraModule } from './agora/agora.module';
import { RecruitModule } from './recruit/recruit.module';
import { AiMentorModule } from './ai-mentor/ai-mentor.module';
import { TaskModule } from './task/task.module';
import { CreditModule } from './credit/credit.module';
import { BadgeModule } from './badge/badge.module';
import { DocumentModule } from './document/document.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    UserModule,
    AuthModule,
    BoardModule,
    PostModule,
    CommentModule,
    LikeModule,
    BookmarkModule,
    ProjectModule,
    SprintModule,
    AgoraModule,
    RecruitModule,
    AiMentorModule,
    TaskModule,
    CreditModule,
    BadgeModule,
    DocumentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
