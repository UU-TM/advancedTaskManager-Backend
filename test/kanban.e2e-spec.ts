import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Kanban (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  let ownerToken: string;
  let memberToken: string;
  let memberUserId: string;
  let workspaceId: string;
  let boardId: string;
  let todoColumnId: string;
  let doneColumnId: string;
  let cardId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    await prisma.$connect();
  });

  beforeEach(async () => {
    await prisma.cardAssignee.deleteMany();
    await prisma.card.deleteMany();
    await prisma.column.deleteMany();
    await prisma.boardMember.deleteMany();
    await prisma.board.deleteMany();
    await prisma.workspaceMember.deleteMany();
    await prisma.workspace.deleteMany();
    await prisma.user.deleteMany();

    const ownerRegister = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ username: 'owner', password: 'password123' })
      .expect(201);

    const memberRegister = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ username: 'member', password: 'password123' })
      .expect(201);

    memberUserId = memberRegister.body.data.id;

    const ownerLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'owner', password: 'password123' })
      .expect(200);

    const memberLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'member', password: 'password123' })
      .expect(200);

    ownerToken = ownerLogin.body.data.accessToken;
    memberToken = memberLogin.body.data.accessToken;

    const workspaceResponse = await request(app.getHttpServer())
      .post('/workspaces')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Product Team' })
      .expect(201);

    workspaceId = workspaceResponse.body.data.id;

    await request(app.getHttpServer())
      .post(`/workspaces/${workspaceId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ userId: memberUserId, role: 'MEMBER' })
      .expect(201);

    const boardResponse = await request(app.getHttpServer())
      .post(`/workspaces/${workspaceId}/boards`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Sprint Board' })
      .expect(201);

    boardId = boardResponse.body.data.id;

    await request(app.getHttpServer())
      .post(`/boards/${boardId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ userId: memberUserId, role: 'EDITOR' })
      .expect(201);

    const todoColumn = await request(app.getHttpServer())
      .post(`/boards/${boardId}/columns`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'Todo' })
      .expect(201);

    const doneColumn = await request(app.getHttpServer())
      .post(`/boards/${boardId}/columns`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'Done' })
      .expect(201);

    todoColumnId = todoColumn.body.data.id;
    doneColumnId = doneColumn.body.data.id;
  });

  it('creates, moves, assigns, and fetches a card', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/cards')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        columnId: todoColumnId,
        title: 'Implement Kanban',
        description: 'Core schema and APIs',
        dueDate: '2026-12-31T00:00:00.000Z',
        priority: 'HIGH',
        category: 'backend',
      })
      .expect(201);

    cardId = createResponse.body.data.id;
    expect(createResponse.body.data.assignees).toEqual([]);
    expect(createResponse.body.data.createdAt).toMatch(/Z$/);
    expect(createResponse.body.data.dueDate).toBe('2026-12-31T00:00:00.000Z');

    const moveResponse = await request(app.getHttpServer())
      .patch(`/cards/${cardId}/move`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ columnId: doneColumnId })
      .expect(200);

    expect(moveResponse.body.data.columnId).toBe(doneColumnId);

    const assignResponse = await request(app.getHttpServer())
      .post(`/cards/${cardId}/assign`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ userId: memberUserId })
      .expect(201);

    expect(assignResponse.body.data.assignees).toEqual([
      { id: memberUserId, username: 'member' },
    ]);

    const getResponse = await request(app.getHttpServer())
      .get(`/cards/${cardId}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(200);

    expect(getResponse.body.data.assignees).toHaveLength(1);

    const removeResponse = await request(app.getHttpServer())
      .delete(`/cards/${cardId}/assign/${memberUserId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expect(removeResponse.body.data.assignees).toEqual([]);
  });

  it('rejects board member invite for non-workspace users', async () => {
    const outsider = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ username: 'outsider', password: 'password123' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/boards/${boardId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ userId: outsider.body.data.id, role: 'VIEWER' })
      .expect(400);
  });

  it('rejects assignment for non-board members', async () => {
    const outsider = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ username: 'outsider2', password: 'password123' })
      .expect(201);

    const cardResponse = await request(app.getHttpServer())
      .post('/cards')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ columnId: todoColumnId, title: 'Guarded card' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/cards/${cardResponse.body.data.id}/assign`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ userId: outsider.body.data.id })
      .expect(400);
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
    if (app) {
      await app.close();
    }
  });
});
