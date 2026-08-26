import { Server } from 'socket.io';

let _io: Server | null = null;

/**
 * Store the Socket.io server instance (called once during app startup).
 */
export function setIO(io: Server): void {
  _io = io;
}

/**
 * Get the Socket.io server instance. Safe to call from routes/services.
 */
export function getIO(): Server | null {
  return _io;
}
