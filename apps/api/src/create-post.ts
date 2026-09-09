export class CreatePostDto {
  title: string;
  content: string;
  authorId: number;
}

export class PostDto {
  id: number;
  title: string;
  content: string;
  authorId: number;
  createdAt: Date;
}
