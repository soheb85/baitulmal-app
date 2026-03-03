import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI as string;

export async function connectDB(){
    try{
        await mongoose.connect(MONGODB_URI,{
            dbName:"baitulmal",
        });
        console.log("MongoDb connected successfully")
    }catch(error){
        console.log("Error to connect MongoDb",error)
        process.exit(1);
    }
}