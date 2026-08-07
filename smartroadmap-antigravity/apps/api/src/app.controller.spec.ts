import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  const connection = {
    readyState: 1,
    collection: () => ({ updateOne: jest.fn().mockResolvedValue({}) }),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: getConnectionToken(), useValue: connection },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it('exposes a root message', () => {
    expect(appController.getHello()).toContain('SmartRoadmap API');
  });

  it('reports healthy when mongo is connected', () => {
    expect(appController.health().status).toBe('ok');
  });

  it('accepts a newsletter subscription', async () => {
    await expect(
      appController.subscribe({ email: 'a@b.com' } as any),
    ).resolves.toMatchObject({
      success: true,
    });
  });
});
