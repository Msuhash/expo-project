import { PartialType } from '@nestjs/mapped-types';
import { CreateExpoDto } from './create-expo.dto.js';

export class UpdateExpoDto extends PartialType(CreateExpoDto) {}

