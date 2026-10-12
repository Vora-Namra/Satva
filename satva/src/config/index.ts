import dotenv from 'dotenv';

dotenv.config();

export const env = {
  PORT: Number(process.env.PORT) || 3333,

  NODE_ENV: process.env.NODE_ENV || 'DEVELOPMENT',
  SESSION_SECRET:process.env.SECRET_SESSION || 'SATVA',

  LOG_LEVEL: process.env.LOG_LEVEL || 'info',

  DB_HOST: process.env.DB_HOST || 'localhost',

  DB_PORT: Number(process.env.DB_PORT) || 3306,

  DB_NAME: process.env.DB_NAME || '',

  DB_USER: process.env.DB_USER || '',

  DB_PASSWORD: process.env.DB_PASSWORD || '',
  REFRESH_TOKEN_SECRET : process.env.REFRESH_TOKEN_SECRET || "",
  JWT_SECRET_KEY: process.env.JWT_SECRET_KEY || 'satva',


GOOGLE_CLIENT_ID:process.env.GOOGLE_CLIENT_ID || '',
GOOGLE_CLIENT_SECRET:process.env.GOOGLE_CLIENT_SECRET || '',
GOOGLE_CALLBACKURL:process.env.GOOGLE_CALLBACKURL || '',

GEMINI_API_KEY:process.env.GEMINI_API_KEY || '',

};