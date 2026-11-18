import {
  Controller,
  Post,
  Patch,
  Get,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { TeamService } from './team.service.js';
import { ExpoAccessGuard } from '../../common/guards/expo-access.guard.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { ExpoRole } from '../../generated/prisma/enums.js';
import { InvitationResponseDto } from './dto/invitation-response.dto.js';
import { CreateInvitationDTO } from './dto/create-invitation.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { UpdateRoleDto } from './dto/update-role.dto.js';

@Controller('team')
export class TeamController {
  constructor(private readonly teamService: TeamService) { }

  @Post(":expoId/invitations")
  @UseGuards(JwtAuthGuard, ExpoAccessGuard)
  @Roles(ExpoRole.Admin)
  @HttpCode(HttpStatus.CREATED)
  async sendInvitation(
    @Param('expoId') expoId: string,
    @CurrentUser("userId") userId: string,
    @Body() dto: CreateInvitationDTO,

  ): Promise<InvitationResponseDto> {

    return this.teamService.createInvitation(userId, expoId, dto)
  }

  @Post("invitations/:id/accept")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async acceptInvitation(@Param('id') id: string, @CurrentUser('userId') inviteeId: string): Promise<{ message: string }> {
    return this.teamService.acceptInvitation(id, inviteeId)
  }

  @Post("invitations/:id/decline")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async declineInvitation(@Param('id') id: string, @CurrentUser('userId') inviteeId: string): Promise<{ message: string }> {
    return this.teamService.declineInvitation(id, inviteeId)
  }

  @Post(":expoId/invitations/:id/revoke")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async revokeInvitation(@Param('id') id: string, @Param('expoId') expoId: string, @CurrentUser('userId') userId: string): Promise<{ message: string }> {
    return this.teamService.revokeInvitation(id, userId)
  }

  @Get('invitations/me')
  @UseGuards(JwtAuthGuard)
  async getInvitationByUser(@CurrentUser('userId') userId: string): Promise<InvitationResponseDto[]> {
    return this.teamService.getInvitationByUser(userId)
  }

  @Get(':expoId/invitations')
  @UseGuards(JwtAuthGuard, ExpoAccessGuard)
  @Roles(ExpoRole.Admin)
  async getInvitationByAdmin(@Param('expoId') expoId: string): Promise<InvitationResponseDto[]> {
    return this.teamService.getInvitationByAdmin(expoId)
  }

  @Patch(':expoId/members/:memberId/role')
  @UseGuards(JwtAuthGuard, ExpoAccessGuard)
  @Roles(ExpoRole.Admin)
  async roleManagement(
    @Param('expoId') expoId: string,
    @Param('memberId') memberId: string,
    @Body() roleDto: UpdateRoleDto,
    @CurrentUser("userId") userId: string,
  ): Promise<{ message: string }> {
    return this.teamService.roleManagement(expoId, roleDto, memberId, userId)
  }

}
