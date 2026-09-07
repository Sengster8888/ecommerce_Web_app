import { IsInt, Min, Max } from 'class-validator';

export class SubmitRatingDto {
  @IsInt()
  @Min(1, { message: 'Rating must be at least 1 star.' })
  @Max(5, { message: 'Rating cannot exceed 5 stars.' })
  rating: number;
}
