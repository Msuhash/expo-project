import { InvitationStatus } from '../../../generated/prisma/client.js';

export class InvitationSummaryDto {
    id: string;
    username: string;
    displayName: string | null;
}

export class InvitationResponseDto {
    id: string;
    status: InvitationStatus;
    expoId: string;
    inviterId: string;
    inviteeId: string;
    createdAt: Date;
    respondedAt: Date | null;
    revokedAt: Date | null;
    inviter?: InvitationSummaryDto;
    invitee?: InvitationSummaryDto;
    expo?: {
        id: string;
        name: string;
        slug: string;
    };
}
