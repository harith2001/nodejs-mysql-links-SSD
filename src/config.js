import { config } from "dotenv";
config();

export const database = {
  connectionLimit: 10,
  host: process.env.DATABASE_HOST || "localhost",
  user: process.env.DATABASE_USER || "fazt",
  password: process.env.DATABASE_PASSWORD || "mypassword",
  database: process.env.DATABASE_NAME || "linksdb",
  port: process.env.DATABASE_PORT || 3306,
};

export const port = process.env.PORT || 4000;

export const SECRET = process.env.SECRET || 'some secret key';

export const GOOGLE_CLIENT_ID= process.env.GOOGLE_CLIENT_ID 
export const GOOGLE_CLIENT_SECRET=process.env.GOOGLE_CLIENT_SECRET