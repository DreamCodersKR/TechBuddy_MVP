import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const isProduction = process.env.NODE_ENV === 'production';

  // DRE-219: Helmet 보안 헤더
  app.use(helmet());

  // Cookie Parser 미들웨어 (Refresh Token용)
  app.use(cookieParser());

  // CORS 설정 - 여러 도메인 허용
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'https://tech-buddy-mvp.vercel.app',
    process.env.FRONTEND_URL,
  ].filter(Boolean);

  // DRE-218: 프로덕션에서 origin 없는 요청 차단
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        if (isProduction) return callback(new Error('Not allowed by CORS'));
        return callback(null, true);
      }
      // Vercel 프리뷰 URL 패턴 허용 (tech-buddy-mvp-*.vercel.app)
      if (origin.match(/^https:\/\/tech-buddy-mvp.*\.vercel\.app$/)) {
        return callback(null, true);
      }
      // 허용된 origin 목록 확인
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  });

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // DRE-217: Swagger는 개발 환경에서만 활성화
  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle('FLOWIT API')
      .setDescription('IT 부트캠프 학생을 위한 성장 플랫폼 API')
      .setVersion('1.0')
      .addBearerAuth()
      .addCookieAuth('refresh_token', {
        type: 'apiKey',
        in: 'cookie',
        name: 'refresh_token',
        description: 'Refresh Token (HttpOnly Cookie)',
      })
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document);
    console.log(`📚 Swagger API Docs: http://localhost:${process.env.PORT ?? 8080}/api-docs`);
  }

  const port = process.env.PORT ?? 8080;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
}

void bootstrap();
