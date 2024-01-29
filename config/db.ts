import mongoose, { Connection } from 'mongoose'

const connectDB = async (): Promise<void> => {
    mongoose.set('strictQuery', true)
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || '', {})
        console.log(`Log: connected to database <${conn.connection.host}>`)
    } catch (error) {
        console.error('Error connecting to MongoDB:')
        // Handle the error appropriately
    }
}

export default connectDB
