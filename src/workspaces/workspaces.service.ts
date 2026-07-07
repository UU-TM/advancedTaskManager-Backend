import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { AddWorkspaceMemberDto } from './dto/add-workspace-member.dto';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import {
  toWorkspaceMemberResponse,
  toWorkspaceResponse,
} from './workspace.mapper';
import { WorkspacesRepository } from './workspaces.repository';

@Injectable()
export class WorkspacesService {
  constructor(
    private readonly workspacesRepository: WorkspacesRepository,
    private readonly usersService: UsersService,
  ) {}

  async create(ownerId: string, dto: CreateWorkspaceDto) {
    const workspace = await this.workspacesRepository.createWithOwnerMembership({
      name: dto.name,
      ownerId,
    });

    return toWorkspaceResponse(workspace);
  }

  async addMember(workspaceId: string, dto: AddWorkspaceMemberDto) {
    const workspace = await this.workspacesRepository.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const user = await this.usersService.findById(dto.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const member = await this.workspacesRepository.upsertMember({
      workspaceId,
      userId: dto.userId,
      role: dto.role,
    });

    return toWorkspaceMemberResponse(member);
  }

  async assertMember(workspaceId: string, userId: string): Promise<void> {
    const workspace = await this.workspacesRepository.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    if (workspace.ownerId === userId) {
      return;
    }

    const isMember = await this.workspacesRepository.isMember(
      workspaceId,
      userId,
    );

    if (!isMember) {
      throw new BadRequestException('User must be a workspace member');
    }
  }
}
