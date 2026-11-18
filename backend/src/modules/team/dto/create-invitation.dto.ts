import {
    IsString,
    IsNotEmpty
} from 'class-validator'


export class CreateInvitationDTO {

    @IsNotEmpty({ message: 'invite user ID is Empty' })
    @IsString({ message: 'userId should a string' })
    inviteeUserId: string;

}