#!/usr/bin/env node
import 'dotenv/config';
import http from 'http';
export default function main(port?: number): http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>;
