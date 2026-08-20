import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';
import {
  DiscussionSpace,
  DiscussionSpaceSchema,
} from '../../schemas/discussion-space.schema';
import { Post, PostSchema } from '../../schemas/post.schema';
import { Comment, CommentSchema } from '../../schemas/comment.schema';
import { Report, ReportSchema } from '../../schemas/report.schema';
import { Roadmap, RoadmapSchema } from '../../schemas/roadmap.schema';
import { Cv, CvSchema } from '../../schemas/cv.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DiscussionSpace.name, schema: DiscussionSpaceSchema },
      { name: Post.name, schema: PostSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: Report.name, schema: ReportSchema },
      { name: Roadmap.name, schema: RoadmapSchema },
      { name: Cv.name, schema: CvSchema },
    ]),
  ],
  controllers: [CommunityController],
  providers: [CommunityService],
  exports: [CommunityService],
})
export class CommunityModule {}
