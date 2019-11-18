import cors from 'cors';
import express from 'express';
import { connect, ConsumeMessage } from 'amqplib';

const { CLOUDAMQP_URL, PORT } = process.env;
const QUEUE_TASKS = 'tasks';
const QUEUE_RESULTS = 'results';

const execute = async (): Promise<void> => {
  const conn = await connect(CLOUDAMQP_URL);
  const ch = await conn.createChannel();
  await ch.assertQueue(QUEUE_TASKS);
  await ch.assertQueue(QUEUE_RESULTS);
  const handleConsume = async (msg: ConsumeMessage): Promise<void> => {
    if (msg === null) {
      return;
    }
    console.log(msg.content.toString());
    ch.ack(msg);
  };
  ch.consume(QUEUE_RESULTS, handleConsume);
  const app = express();
  app.use(cors());
  app.get('/', (req, res) => res.send({ hello: 'world' }));
  app.get('/upload', (req, res) => {
    ch.sendToQueue(QUEUE_TASKS, Buffer.from('hello'));
    res.send({ hello: 'upload' });
  });
  // eslint-disable-next-line
  app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`));
  const handleSIGTERM = async (): Promise<void> => {
    await conn.close();
    process.exit(1);
  };
  process.on('SIGTERM', handleSIGTERM);
};
execute();
