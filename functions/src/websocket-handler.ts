/**
 * WebSocket Handler for Real-time Communication
 * Manages live updates during report generation and PDF processing
 */

import { onRequest } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { getApp } from 'firebase-admin/app';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import express from 'express';
import cors from 'cors';

interface ProgressUpdate {
  type: 'pdf_extraction' | 'ai_generation' | 'file_upload' | 'report_compilation';
  stage: string;
  progress: number; // 0-100
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface ClientConnection {
  userId: string;
  projectId?: string;
  socketId: string;
  connectedAt: Date;
}

class WebSocketManager {
  private io: SocketIOServer;
  private connections: Map<string, ClientConnection> = new Map();
  private db = getFirestore(getApp());

  constructor(server: any) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? ['https://ecologen.vercel.app', 'https://app.ecologen.com']
          : ['http://localhost:3000', 'http://127.0.0.1:3000'],
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupEventHandlers();
    this.setupFirestoreListeners();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Handle user authentication
      socket.on('authenticate', async (data: { userId: string; projectId?: string; token: string }) => {
        try {
          // Verify Firebase token here if needed
          const connection: ClientConnection = {
            userId: data.userId,
            projectId: data.projectId,
            socketId: socket.id,
            connectedAt: new Date(),
          };

          this.connections.set(socket.id, connection);
          
          // Join user-specific room
          socket.join(`user:${data.userId}`);
          
          // Join project-specific room if provided
          if (data.projectId) {
            socket.join(`project:${data.projectId}`);
          }

          socket.emit('authenticated', { status: 'success' });
          console.log(`User ${data.userId} authenticated on socket ${socket.id}`);

        } catch (error) {
          socket.emit('authentication_error', { error: 'Invalid token' });
          socket.disconnect();
        }
      });

      // Handle project subscription
      socket.on('subscribe_project', (data: { projectId: string }) => {
        const connection = this.connections.get(socket.id);
        if (connection) {
          // Leave old project room
          if (connection.projectId) {
            socket.leave(`project:${connection.projectId}`);
          }
          
          // Join new project room
          socket.join(`project:${data.projectId}`);
          connection.projectId = data.projectId;
          
          console.log(`Socket ${socket.id} subscribed to project ${data.projectId}`);
        }
      });

      // Handle manual progress requests
      socket.on('request_progress', async (data: { generationId?: string; extractionId?: string }) => {
        const connection = this.connections.get(socket.id);
        if (!connection) return;

        try {
          if (data.generationId) {
            const genDoc = await this.db.collection('generations').doc(data.generationId).get();
            if (genDoc.exists) {
              socket.emit('progress_update', {
                type: 'ai_generation',
                data: genDoc.data(),
              });
            }
          }

          if (data.extractionId) {
            const extDoc = await this.db.collection('extractions').doc(data.extractionId).get();
            if (extDoc.exists) {
              socket.emit('progress_update', {
                type: 'pdf_extraction',
                data: extDoc.data(),
              });
            }
          }
        } catch (error) {
          console.error('Error fetching progress:', error);
        }
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        this.connections.delete(socket.id);
        console.log(`Client disconnected: ${socket.id}`);
      });
    });
  }

  private setupFirestoreListeners() {
    // Listen for generation updates
    this.db.collection('generations').onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified' || change.type === 'added') {
          const data = change.doc.data();
          this.broadcastToProject(data.projectId, 'generation_update', {
            generationId: change.doc.id,
            ...data,
          });
        }
      });
    });

    // Listen for extraction updates
    this.db.collection('extractions').onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified' || change.type === 'added') {
          const data = change.doc.data();
          this.broadcastToProject(data.projectId, 'extraction_update', {
            extractionId: change.doc.id,
            ...data,
          });
        }
      });
    });

    // Listen for project updates
    this.db.collection('projects').onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const data = change.doc.data();
          this.broadcastToProject(change.doc.id, 'project_update', data);
        }
      });
    });
  }

  public broadcastToUser(userId: string, event: string, data: any) {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  public broadcastToProject(projectId: string, event: string, data: any) {
    if (projectId) {
      this.io.to(`project:${projectId}`).emit(event, data);
    }
  }

  public broadcastProgress(projectId: string, userId: string, update: ProgressUpdate) {
    const payload = {
      ...update,
      timestamp: new Date(),
    };

    // Broadcast to project and user rooms
    this.broadcastToProject(projectId, 'progress_update', payload);
    this.broadcastToUser(userId, 'progress_update', payload);
  }

  public getConnectedUsers(): string[] {
    const users = new Set<string>();
    this.connections.forEach(conn => users.add(conn.userId));
    return Array.from(users);
  }

  public getConnectionCount(): number {
    return this.connections.size;
  }
}

// Create Express app for WebSocket server
const app = express();
app.use(cors());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    connections: wsManager.getConnectionCount(),
    timestamp: new Date().toISOString() 
  });
});

// Create HTTP server
const server = createServer(app);

// Initialize WebSocket manager
const wsManager = new WebSocketManager(server);

// Export the WebSocket handler
export const handleWebSocketConnection = onRequest({
  region: 'australia-southeast1',
  memory: '512MiB',
  timeoutSeconds: 540,
  cors: true,
}, (req: any, res: any) => {
    // This function handles the HTTP upgrade for WebSocket connections
    server.emit('request', req, res);
  }
);

// Export WebSocket manager for use in other functions
export { wsManager as WebSocketManager };

// Helper function to send progress updates from other Cloud Functions
export const sendProgressUpdate = async (
  projectId: string,
  userId: string,
  update: ProgressUpdate
) => {
  if (wsManager) {
    wsManager.broadcastProgress(projectId, userId, update);
  }
  
  // Also store in Firestore for persistence
  const db = getFirestore(getApp());
  await db.collection('progress_updates').add({
    projectId,
    userId,
    ...update,
    createdAt: new Date(),
  });
};