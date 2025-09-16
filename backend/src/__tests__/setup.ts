import { connectDatabase } from '../config/database';

// Setup test database
beforeAll(async () => {
  // Use test database URL
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://operator:operator123@localhost:5432/operator_app_test';
  await connectDatabase();
});

// Clean up after tests
afterAll(async () => {
  // Close database connection
  // Add cleanup logic here if needed
});
