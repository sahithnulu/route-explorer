import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import router from './routes/routeHandler'

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

app.use(express.json());

app.get('/health', (req, res) => {
    res.status(200).json({ status: "ok" });
});

app.use('/', router)

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

export default app;