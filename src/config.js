import { config } from "dotenv";
config();

export const database = {
  connectionLimit: 10,
  host: process.env.DATABASE_HOST ,
  user: process.env.DATABASE_USER ,
  password: process.env.DATABASE_PASSWORD ,
  database: process.env.DATABASE_NAME,
  port: process.env.DATABASE_PORT ,
};

export const port = process.env.PORT;
export const SECRET = process.env.SECRET ;

export const GOOGLE_CLIENT_ID= process.env.GOOGLE_CLIENT_ID 
export const GOOGLE_CLIENT_SECRET=process.env.GOOGLE_CLIENT_SECRET