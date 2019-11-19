import { connect, ConsumeMessage } from 'amqplib';
import cors from 'cors';
import express from 'express';

const { CLOUDAMQP_URL, PORT } = process.env;
const QUEUE_TASKS = 'tasks';

const execute = async (): Promise<void> => {
  const conn = await connect(CLOUDAMQP_URL);
  const ch = await conn.createChannel();
  await ch.assertQueue(QUEUE_TASKS);
  const { queue } = await ch.assertQueue('', {
    exclusive: true,
  });
  const handleConsume = async (msg: ConsumeMessage): Promise<void> => {
    if (msg === null) {
      return;
    }
    const { content } = msg;
    console.log(content.toString());
    ch.ack(msg);
  };
  ch.consume(queue, handleConsume);
  const app = express();
  app.use(cors());
  app.get('/', (req, res) => res.send({ hello: 'world' }));
  app.get('/upload', (req, res) => {
    ch.sendToQueue(QUEUE_TASKS, Buffer.from('hello'), { replyTo: queue });
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
