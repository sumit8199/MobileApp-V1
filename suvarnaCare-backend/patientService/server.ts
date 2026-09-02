// server.ts
import 'dotenv/config';
import main from './src/main.js';

const PORT = parseInt(process.env.PORT || '5001', 10);
main(PORT);
