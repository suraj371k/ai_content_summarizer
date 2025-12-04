import mongoose from "mongoose";

const summarySchema = new mongoose.Schema(
  {
    title: String,
    summary: String,
    url: String
  },
  { timestamps: true }
);


const Summary = mongoose.model("Summary" , summarySchema)

export default Summary;