import dotenv from 'dotenv'
import { expand } from 'dotenv-expand';
const result = expand(dotenv.config({ path: `../config/.env.${process.env.NODE_ENV}` }))
if (result.error) {
  throw result.error;
}
import {startServer} from './server.mjs'

await startServer()