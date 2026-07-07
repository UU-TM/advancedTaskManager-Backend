import { Workspace, WorkspaceMember } from '../generated/prisma-client/client';
import { z } from 'zod';
import {
  WorkspaceMemberSchema,
  WorkspaceSchema,
} from './dto/workspace-responses.dto';

export type WorkspaceResponse = z.infer<typeof WorkspaceSchema>;
export type WorkspaceMemberResponse = z.infer<typeof WorkspaceMemberSchema>;

export function toWorkspaceResponse(workspace: Workspace): WorkspaceResponse {
  return {
    id: workspace.id,
    name: workspace.name,
    ownerId: workspace.ownerId,
    createdAt: workspace.createdAt.toISOString(),
    updatedAt: workspace.updatedAt.toISOString(),
  };
}

export function toWorkspaceMemberResponse(
  member: WorkspaceMember,
): WorkspaceMemberResponse {
  return {
    workspaceId: member.workspaceId,
    userId: member.userId,
    role: member.role,
    createdAt: member.createdAt.toISOString(),
  };
}
