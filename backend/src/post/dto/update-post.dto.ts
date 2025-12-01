import { PartialType } from '@nestjs/swagger';
import { CreatePostDto } from './create-post.dto';
import { OmitType } from '@nestjs/swagger';

// boardId는 수정 불가, 나머지 필드는 선택적 수정 가능
export class UpdatePostDto extends PartialType(
  OmitType(CreatePostDto, ['boardId'] as const),
) {}
