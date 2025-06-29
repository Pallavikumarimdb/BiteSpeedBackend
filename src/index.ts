import express from 'express';
import identifyRouter from './routes/identify';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use('/identify', identifyRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
