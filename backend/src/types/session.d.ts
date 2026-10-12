import 'express-session';

declare module 'express-session' {
  interface SessionData {
    googleToken?: string; // Add your custom properties here
  }
}