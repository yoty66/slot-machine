import { Hono } from "hono";
import getSession from './getSession/getSession.controller';

const router = new Hono();

router.route('/', getSession);

export default router;
