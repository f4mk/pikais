import { main } from './main';

// Start the application
main().catch(error => {
  console.error('Error in main application:', error);
  process.exit(1);
});
