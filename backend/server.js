import express from "express";
import cors from 'cors'
import dotenv from "dotenv";
import { connectDb } from "./config/db.js";

//import routes
import summaryRoutes from "./routes/summary.routes.js";

dotenv.config();
const app = express();

app.use(express.json());
app.use(cors())

//routs
app.use("/api/summary", summaryRoutes);

//database connection
connectDb();

app.listen(5000, () => {
  console.log(`app is running`);
});
