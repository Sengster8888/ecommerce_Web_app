import { IsNotEmpty, IsString, IsIn, IsOptional } from 'class-validator';

export class SimulateCallbackDto {
  @IsNotEmpty()
  @IsString()
  providerReference: string; // The transaction ID / reference to settle

  @IsNotEmpty()
  @IsString()
  @IsIn(['PAID', 'FAILED'])
  status: 'PAID' | 'FAILED';

  @IsOptional()
  @IsString()
  failureReason?: string;
}
