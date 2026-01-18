import mongoose from "mongoose";

const connectDb = async () => {
  try {
    console.log("Mongo", process.env.MONGO_URI);
    const con = await mongoose.connect(process.env.MONGO_URI);
    console.log(`Database conntected to ${con.connection.host}`);
  } catch (error) {
    console.log(error);
  }
};

export default connectDb;
