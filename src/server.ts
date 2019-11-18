import cors from 'cors';
import express from 'express';
import { connect } from 'amqplib';

const { CLOUDAMQP_URL, PORT } = process.env;
const QUEUE = 'tasks';

const execute = async (): Promise<void> => {
  const conn = await connect(CLOUDAMQP_URL);
  const ch = await conn.createChannel();
  ch.assertQueue(QUEUE);
  const app = express();
  app.use(cors());
  app.get('/', (req, res) => res.send({ hello: 'world' }));
  app.get('/upload', (req, res) => {
    ch.sendToQueue(QUEUE, Buffer.from('hello world'));
    res.send({ hello: 'upload' });
  });
  // eslint-disable-next-line
  app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`));
};
execute();
