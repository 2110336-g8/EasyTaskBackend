import mongoose, { Connection } from 'mongoose';

const connectDB = async (): Promise<boolean> => {
    mongoose.set('strictQuery', true);
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || '', {});
        console.log(`Log: connected to database <${conn.connection.host}>`);
        return true;
    } catch (error) {
        console.error('Error connecting to MongoDB:');
        return false;
    }
};

export default connectDB;
