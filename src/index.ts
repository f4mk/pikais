import dotenv from 'dotenv';

import { main } from './main';

// Load environment variables
dotenv.config();

// Start the application
main().catch(error => {
  console.error('Error in main application:', error);
  process.exit(1);
});
