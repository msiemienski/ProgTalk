import mongoose from 'mongoose';

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error('❌ MONGODB_URI is not set. Configure it in your deployment environment variables.');
    if (process.env.NODE_ENV === 'production') process.exit(1);
    return;
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
    });

    return conn;
  } catch (error) {
    let parsedInfo = '';
    try {
      const parsed = new URL(mongoUri);
      const dbName = parsed.pathname?.replace('/', '') || '(default)';
      parsedInfo = ` host=${parsed.host} db=${dbName} user=${parsed.username ? 'set' : 'missing'}`;
    } catch {
      parsedInfo = ' (could not parse MONGODB_URI)';
    }

    console.error(`❌ Error connecting to MongoDB:${parsedInfo}`);
    console.error(`   ${error.message}`);
    if (String(error.message).toLowerCase().includes('authentication failed')) {
      console.error('   Check Atlas DB user/password, URL-encode special password characters, and confirm IP access list allows Render.');
    }

    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }

    // Retry connection after 5 seconds
    setTimeout(connectDB, 5000);
  }
};

export default connectDB;
