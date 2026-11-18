import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { CreateInvitationDTO } from './dto/create-invitation.dto.js';
import { UpdateRoleDto } from './dto/update-role.dto.js';
import { InvitationResponseDto } from './dto/invitation-response.dto.js';
import { ExpoStatus, ExpoRole, InvitationStatus, MembershipStatus } from '../../generated/prisma/enums.js';

interface InvitationWithRelations {
    id: string;
    expoId: string;
    inviterUserId: string;
    inviteeUserId: string;
    status: InvitationStatus;
    createdAt: Date;
    respondedAt: Date | null;
    revokedAt: Date | null;
    expo?: {
        id: string;
        name: string;
        slug: string;
    } | null;
    inviterUser?: {
        id: string;
        username: string;
        displayName: string | null;
    } | null;
    inviteeUser?: {
        id: string;
        username: string;
        displayName: string | null;
    } | null;
}

@Injectable()
export class TeamService {
    constructor(private readonly prisma: PrismaService) { }

    async createInvitation(
        userId: string,
        expoId: string,
        dto: CreateInvitationDTO,
    ): Promise<InvitationResponseDto> {

        const expo = await this.prisma.expo.findUnique({
            where: {
                id: expoId,
            },
        });

        if (!expo) {
            throw new NotFoundException(`expo "${expoId}" is not found`);
        }

        if (expo.status === ExpoStatus.Cancelled || expo.status === ExpoStatus.Completed) {
            throw new BadRequestException("the expo should be in draft, published, or ongoing mode to send invitations");
        }

        const membership = await this.prisma.expoMembership.findUnique({
            where: {
                expoId_userId: {
                    expoId,
                    userId,
                },
            },
        });

        if (!membership || membership.role !== ExpoRole.Admin) {
            throw new ForbiddenException("You are not authorized to perform this action");
        }

        const inviteeUser = await this.prisma.user.findUnique({
            where: {
                id: dto.inviteeUserId,
            },
        });

        if (!inviteeUser) {
            throw new NotFoundException("Invited user is not found");
        }

        if (inviteeUser.id === userId) {
            throw new BadRequestException("You cannot send an invitation to yourself");
        }

        const inviteeMembership = await this.prisma.expoMembership.findUnique({
            where: {
                expoId_userId: {
                    expoId,
                    userId: inviteeUser.id,
                },
            },
        });

        if (inviteeMembership && inviteeMembership.status === MembershipStatus.Active) {
            throw new ConflictException("User is already an active member of this expo workspace");
        }

        const existingInvitation = await this.prisma.invitation.findFirst({
            where: {
                expoId,
                inviteeUserId: dto.inviteeUserId,
                status: InvitationStatus.Pending,
            },
        });

        if (existingInvitation) {
            throw new ConflictException("The invitation is already sent and in pending status");
        }

        const invitation = await this.prisma.invitation.create({
            data: {
                expoId,
                inviterUserId: userId,
                inviteeUserId: dto.inviteeUserId,
                status: InvitationStatus.Pending,
            },
            include: {
                expo: { select: { id: true, name: true, slug: true } },
                inviterUser: { select: { id: true, username: true, displayName: true } },
                inviteeUser: { select: { id: true, username: true, displayName: true } },
            },
        });

        return this.toSafeInvitation(invitation);
    }


    async getInvitationByAdmin(expoId: string): Promise<InvitationResponseDto[]> {

        const invitations = await this.prisma.invitation.findMany({
            where: {
                expoId,
            },
            include: {
                expo: { select: { id: true, name: true, slug: true } },
                inviterUser: { select: { id: true, username: true, displayName: true } },
                inviteeUser: { select: { id: true, username: true, displayName: true } },
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return invitations.map((invitation) => this.toSafeInvitation(invitation));

    }

    async getInvitationByUser(userId: string): Promise<InvitationResponseDto[]> {

        const invitations = await this.prisma.invitation.findMany({
            where: {
                inviteeUserId: userId,
                status: InvitationStatus.Pending,
            },
            include: {
                expo: { select: { id: true, name: true, slug: true } },
                inviterUser: { select: { id: true, username: true, displayName: true } },
                inviteeUser: { select: { id: true, username: true, displayName: true } },
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return invitations.map((invitation) => this.toSafeInvitation(invitation));

    }


    async acceptInvitation(id: string, inviteeId: string): Promise<{ message: string }> {

        const invite = await this.prisma.invitation.findUnique({
            where: { id }
        })

        if (!invite) {
            throw new NotFoundException("Invitation not found");
        }

        if (invite.inviteeUserId !== inviteeId) {
            throw new ForbiddenException("you cannot accept invitation not sent to you");
        }

        if (invite.status !== InvitationStatus.Pending) {
            throw new BadRequestException("you cannot accept invitation which is not in pending status");
        }

        await this.prisma.$transaction(async (tx) => {

            await tx.invitation.update({
                where: {
                    id,
                },
                data: {
                    status: InvitationStatus.Accepted,
                    respondedAt: new Date()
                },
            });

            await tx.expoMembership.upsert({
                where: {
                    expoId_userId: {
                        expoId: invite.expoId,
                        userId: inviteeId,
                    },
                },
                update: {
                    status: MembershipStatus.Active,
                    role: ExpoRole.Member,
                    removedAt: null,
                },
                create: {
                    expoId: invite.expoId,
                    role: ExpoRole.Member,
                    userId: inviteeId,
                    status: MembershipStatus.Active,
                },
            });
        });

        return { message: "Invitation accepted successfully" }
    }

    async declineInvitation(id: string, inviteeId: string): Promise<{ message: string }> {
        const invite = await this.prisma.invitation.findUnique({
            where: { id }
        })

        if (!invite) {
            throw new NotFoundException("Invitation not found");
        }

        if (invite.inviteeUserId !== inviteeId) {
            throw new ForbiddenException("you cannot decline invitation not sent to you");
        }

        if (invite.status !== InvitationStatus.Pending) {
            throw new BadRequestException("you cannot decline invitation which is not in pending status");
        }

        await this.prisma.invitation.update({
            where: {
                id,
            },
            data: {
                status: InvitationStatus.Declined,
                respondedAt: new Date()
            },
        });

        return { message: "Invitation declined successfully" }
    }

    async revokeInvitation(id: string, userId: string): Promise<{ message: string }> {
        const invite = await this.prisma.invitation.findUnique({
            where: {
                id
            }
        })

        if (!invite) {
            throw new NotFoundException("Invitation not found");
        }

        const membership = await this.prisma.expoMembership.findUnique({
            where: {
                expoId_userId: {
                    expoId: invite.expoId,
                    userId: userId
                }
            }
        })

        if (!membership || membership.role !== ExpoRole.Admin) {
            throw new ForbiddenException("you cannot revoke invitation not sent by you or you are not admin")
        }

        if (invite.status !== InvitationStatus.Pending) {
            throw new BadRequestException("you cannot revoke invitation which is not in pending status");
        }

        await this.prisma.invitation.update({
            where: {
                id,
            },
            data: {
                status: InvitationStatus.Revoked,
                revokedAt: new Date()
            },
        });

        return { message: "Invitation revoked successfully" }
    }

    async roleManagement(
        expoId: string,
        roleDto: UpdateRoleDto,
        memberId: string,
        userId: string,
    ): Promise<{ message: string }> {
        const newRole = roleDto.role;

        if (!newRole) {
            throw new NotFoundException("The role is not found");
        }

        if (newRole === ExpoRole.Admin) {
            throw new BadRequestException("You cannot assign the Admin role; each expo has a single Admin");
        }

        const adminMembership = await this.prisma.expoMembership.findUnique({
            where: {
                expoId_userId: {
                    expoId,
                    userId,
                },
            },
        });

        if (
            !adminMembership ||
            adminMembership.status !== MembershipStatus.Active ||
            adminMembership.role !== ExpoRole.Admin
        ) {
            throw new ForbiddenException("You cannot manage roles because you are not an active Admin of this expo");
        }

        const membership = await this.prisma.expoMembership.findUnique({
            where: {
                expoId_userId: {
                    expoId,
                    userId: memberId,
                },
            },
        });

        if (!membership) {
            throw new NotFoundException("The member was not found in this expo");
        }

        if (membership.status !== MembershipStatus.Active) {
            throw new BadRequestException("Cannot change the role of a removed member. Re-invite them to reactivate.");
        }

        if (membership.role === newRole) {
            return { message: "The user already has this role" };
        }

        if (membership.role === ExpoRole.Admin) {
            throw new BadRequestException("The expo Admin cannot be demoted");
        }

        await this.prisma.expoMembership.update({
            where: {
                expoId_userId: {
                    expoId,
                    userId: memberId,
                },
            },
            data: {
                role: newRole,
            },
        });

        return { message: "Role updated successfully" };
    }


    private toSafeInvitation(invitation: InvitationWithRelations): InvitationResponseDto {
        return {
            id: invitation.id,
            status: invitation.status,
            expoId: invitation.expoId,
            inviterId: invitation.inviterUserId,
            inviteeId: invitation.inviteeUserId,
            createdAt: invitation.createdAt,
            respondedAt: invitation.respondedAt,
            revokedAt: invitation.revokedAt,
            inviter: invitation.inviterUser ? {
                id: invitation.inviterUser.id,
                username: invitation.inviterUser.username,
                displayName: invitation.inviterUser.displayName,
            } : undefined,
            invitee: invitation.inviteeUser ? {
                id: invitation.inviteeUser.id,
                username: invitation.inviteeUser.username,
                displayName: invitation.inviteeUser.displayName,
            } : undefined,
            expo: invitation.expo ? {
                id: invitation.expo.id,
                name: invitation.expo.name,
                slug: invitation.expo.slug,
            } : undefined,
        };
    }
}
