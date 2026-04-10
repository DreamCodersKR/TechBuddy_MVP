import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
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
import { XpModule } from './xp/xp.module';
import { NotificationModule } from './notification/notification.module';
import { AdminModule } from './admin/admin.module';
import { InquiryModule } from './inquiry/inquiry.module';
import { ReportModule } from './report/report.module';
import { TilModule } from './til/til.module';
import { QuestModule } from './quest/quest.module';
import { ReferralModule } from './referral/referral.module';
import { StudyModule } from './study/study.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { CoffeeChatModule } from './coffee-chat/coffee-chat.module';
import { KptModule } from './kpt/kpt.module';
import { ModerationModule } from './moderation/moderation.module';
import { EmbeddingModule } from './embedding/embedding.module';
import { CurriculumModule } from './curriculum/curriculum.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // DRE-216: Rate Limiting
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 120,
    }]),
    // DRE-220: 크론잡 스케줄러
    ScheduleModule.forRoot(),
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
    XpModule,
    NotificationModule,
    AdminModule,
    InquiryModule,
    ReportModule,
    TilModule,
    QuestModule,
    ReferralModule,
    StudyModule,
    PortfolioModule,
    CoffeeChatModule,
    KptModule,
    ModerationModule,
    EmbeddingModule,
    CurriculumModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // DRE-216: 전역 Rate Limiting Guard
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
