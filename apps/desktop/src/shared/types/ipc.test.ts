import { describe, it, expect } from 'vitest';
import type {
  IPCMessage,
  IPCResponse,
  PingMessage,
  MatrixCreateMessage,
  MatrixListMessage,
  MatrixGetMessage,
  MatrixUpdateMessage,
  MatrixDeleteMessage,
  SourceCreateMessage,
  SourceListMessage,
  SourceGetMessage,
  MatrixAddSourceMessage,
  MatrixRemoveSourceMessage,
} from './ipc';

/**
 * Type validation tests for IPC message contracts.
 * These tests verify that the type interfaces can be instantiated correctly
 * and maintain the expected structure for Electron-Python communication.
 */
describe('IPC Message Types', () => {
  describe('Base Types', () => {
    it('validates IPCMessage structure', () => {
      const message: IPCMessage = { type: 'test' };
      expect(message.type).toBe('test');
      expect(message.data).toBeUndefined();
      expect(message.db_path).toBeUndefined();
    });

    it('validates IPCMessage with data', () => {
      const message: IPCMessage<{ key: string }> = {
        type: 'test',
        data: { key: 'value' },
      };
      expect(message.data?.key).toBe('value');
    });

    it('validates IPCResponse success', () => {
      const response: IPCResponse<{ result: string }> = {
        success: true,
        data: { result: 'ok' },
      };
      expect(response.success).toBe(true);
      expect(response.data?.result).toBe('ok');
    });

    it('validates IPCResponse error', () => {
      const response: IPCResponse = {
        success: false,
        error: 'Something went wrong',
      };
      expect(response.success).toBe(false);
      expect(response.error).toBe('Something went wrong');
    });
  });

  describe('Ping Message', () => {
    it('validates ping message', () => {
      const message: PingMessage = { type: 'ping' };
      expect(message.type).toBe('ping');
    });
  });

  describe('Matrix Messages', () => {
    it('validates matrix-create message', () => {
      const message: MatrixCreateMessage = {
        type: 'matrix-create',
        data: { name: 'My Matrix' },
      };
      expect(message.type).toBe('matrix-create');
      expect(message.data.name).toBe('My Matrix');
    });

    it('validates matrix-list message', () => {
      const message: MatrixListMessage = { type: 'matrix-list' };
      expect(message.type).toBe('matrix-list');
    });

    it('validates matrix-get message', () => {
      const message: MatrixGetMessage = {
        type: 'matrix-get',
        data: { id: 'uuid-123' },
      };
      expect(message.type).toBe('matrix-get');
      expect(message.data.id).toBe('uuid-123');
    });

    it('validates matrix-update message', () => {
      const message: MatrixUpdateMessage = {
        type: 'matrix-update',
        data: { id: 'uuid-123', name: 'Updated Name' },
      };
      expect(message.type).toBe('matrix-update');
      expect(message.data.id).toBe('uuid-123');
      expect(message.data.name).toBe('Updated Name');
    });

    it('validates matrix-delete message', () => {
      const message: MatrixDeleteMessage = {
        type: 'matrix-delete',
        data: { id: 'uuid-123' },
      };
      expect(message.type).toBe('matrix-delete');
      expect(message.data.id).toBe('uuid-123');
    });
  });

  describe('Source Messages', () => {
    it('validates source-create message', () => {
      const message: SourceCreateMessage = {
        type: 'source-create',
        data: { name: 'my-repo', path: '/path/to/repo', url: 'https://github.com/user/repo' },
      };
      expect(message.type).toBe('source-create');
      expect(message.data.name).toBe('my-repo');
      expect(message.data.path).toBe('/path/to/repo');
    });

    it('validates source-create without optional url', () => {
      const message: SourceCreateMessage = {
        type: 'source-create',
        data: { name: 'local-repo', path: '/local/path' },
      };
      expect(message.data.url).toBeUndefined();
    });

    it('validates source-list message', () => {
      const message: SourceListMessage = { type: 'source-list' };
      expect(message.type).toBe('source-list');
    });

    it('validates source-get message', () => {
      const message: SourceGetMessage = {
        type: 'source-get',
        data: { id: 'source-uuid' },
      };
      expect(message.type).toBe('source-get');
      expect(message.data.id).toBe('source-uuid');
    });
  });

  describe('Matrix-Source Association Messages', () => {
    it('validates matrix-add-source message', () => {
      const message: MatrixAddSourceMessage = {
        type: 'matrix-add-source',
        data: { matrixId: 'matrix-uuid', sourceId: 'source-uuid' },
      };
      expect(message.type).toBe('matrix-add-source');
      expect(message.data.matrixId).toBe('matrix-uuid');
      expect(message.data.sourceId).toBe('source-uuid');
    });

    it('validates matrix-remove-source message', () => {
      const message: MatrixRemoveSourceMessage = {
        type: 'matrix-remove-source',
        data: { matrixId: 'matrix-uuid', sourceId: 'source-uuid' },
      };
      expect(message.type).toBe('matrix-remove-source');
      expect(message.data.matrixId).toBe('matrix-uuid');
      expect(message.data.sourceId).toBe('source-uuid');
    });
  });
});
