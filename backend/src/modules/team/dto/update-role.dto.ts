import { ExpoRole } from "../../../generated/prisma/enums.js";
import { IsEnum, IsNotEmpty } from 'class-validator'

export class UpdateRoleDto {

    @IsNotEmpty({ message: 'Role is empty' })
    @IsEnum(ExpoRole, { message: 'Role must be Manager or Member' })
    role: ExpoRole;
}