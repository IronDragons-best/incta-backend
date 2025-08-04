import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { FilesServiceController } from '../../src/interface/files-service.controller';
import { FilesServiceService } from '../../src/application/files-service.service';
import { AppNotification } from '@common';

describe('FilesController', () => {
  let controller: FilesServiceController;
  let commandBus: { execute: jest.Mock };

  beforeEach(async () => {
    commandBus = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilesServiceController],
      providers: [
        { provide: FilesServiceService, useValue: {} },
        { provide: CommandBus, useValue: commandBus },
        { provide: QueryBus, useClass: QueryBus },
      ],
    }).compile();

    controller = module.get(FilesServiceController);
  });

  const expectCommandCalledWith = (postId: string) => {
    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({ postId: +postId }),
    );
  };

  describe('DELETE /delete', () => {
    it('should return success response when files are deleted', async () => {
      const postId = '1';
      commandBus.execute.mockResolvedValueOnce({ success: true });

      const result = await controller.deletePostFiles(postId);

      expect(result).toEqual({ success: true });
      expectCommandCalledWith(postId);
    });

    it('should throw error if command bus rejects', async () => {
      const postId = '1';
      commandBus.execute.mockRejectedValueOnce(new Error('Delete failed'));

      await expect(controller.deletePostFiles(postId)).rejects.toThrow('Delete failed');
      expectCommandCalledWith(postId);
    });

    it('should return 404 AppNotification if no files are found', async () => {
      const postId = '1';
      const errorNotification = new AppNotification().setNotFound('Files not found');
      commandBus.execute.mockResolvedValueOnce(errorNotification);

      const result = await controller.deletePostFiles(postId);

      expect(result).toEqual(
        expect.objectContaining({
          statusCode: 404,
          errors: [{ message: 'Files not found' }],
        }),
      );
      expectCommandCalledWith(postId);
    });

    it('should throw error if deletion fails unexpectedly', async () => {
      const postId = '1';
      commandBus.execute.mockRejectedValueOnce(new Error('Deletion error'));

      await expect(controller.deletePostFiles(postId)).rejects.toThrow('Deletion error');
      expectCommandCalledWith(postId);
    });
  });
});
