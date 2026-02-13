// Script to initialize database and create first admin user
// Run with: npm run db:setup

import '../dotenv-config.js';
import { createClient } from '@libsql/client/web';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupDatabase() {
  console.log('🚀 Setting up database...\n');

  const turso = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  try {
    // Read and execute schema SQL
    const schemaPath = path.join(__dirname, '../lib/db/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      await turso.execute(statement);
      console.log('✓ Executed:', statement.substring(0, 50) + '...');
    }

    console.log('\n✅ Database schema created successfully!\n');

    // Create first admin user
    console.log('👤 Creating admin user...');
    
    // Import bcryptjs dynamically
    const bcrypt = (await import('bcryptjs')).default;
    
    const adminId = `admin-${Date.now()}`;
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@sitedotmoss.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'changeme123';
    const adminName = 'Admin';
    
    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    
    await turso.execute({
      sql: `INSERT INTO users (id, email, name, password_hash, role) 
            VALUES (?, ?, ?, ?, ?)`,
      args: [adminId, adminEmail, adminName, passwordHash, 'admin']
    });

    console.log('✅ Admin user created!');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log('\n⚠️  IMPORTANT: Change your password after first login!\n');

    // Create a sample blog post
    console.log('📝 Creating sample blog post...');
    
    const postId = `post-${Date.now()}`;
    const postSlug = 'welcome-to-my-blog';
    
    await turso.execute({
      sql: `INSERT INTO posts (id, title, slug, excerpt, content, author_id, author_name, tags, published) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        postId,
        'Welcome to My Blog',
        postSlug,
        'This is my first blog post! Learn about my journey in tech and creative projects.',
        '# Welcome to My Blog 🎨\n\nHi! I\'m excited to share my thoughts, projects, and experiences here.\n\n## What to Expect\n\n- **Tech tutorials** and tips\n- **Project showcases** from my portfolio\n- **Design insights** and creative process\n- **Learning journey** in web development\n\nStay tuned for more content! Feel free to leave comments and connect with me.\n\n---\n\nHappy reading! ✨',
        adminId,
        adminName,
        JSON.stringify(['welcome', 'intro', 'meta']),
        1 // published
      ]
    });

    console.log('✅ Sample post created!\n');
    console.log('🎉 Setup complete! Your blog is ready.\n');
    console.log('💡 Run "npm run dev" to start the development server.\n');
    
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase();
