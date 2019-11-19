import { connect, ConsumeMessage } from 'amqplib';
import cors from 'cors';
import express from 'express';
import uuidv4 from 'uuid/v4';

interface Callbacks {
  [key: string]: (content: string) => void;
}

const { CLOUDAMQP_URL, PORT } = process.env;
const QUEUE = 'tasks';

const callbacks: Callbacks = {};

const execute = async (): Promise<void> => {
  const conn = await connect(CLOUDAMQP_URL);
  const ch = await conn.createChannel();
  await ch.assertQueue(QUEUE);
  const { queue } = await ch.assertQueue('', {
    exclusive: true,
  });
  const handleConsume = async (msg: ConsumeMessage): Promise<void> => {
    if (msg === null) {
      return;
    }
    const {
      content,
      properties: { correlationId },
    } = msg;
    callbacks[correlationId](content.toString());
    ch.ack(msg);
  };
  ch.consume(queue, handleConsume);
  const app = express();
  app.use(cors());
  app.get('/', (req, res) => res.send({ hello: 'world' }));
  app.get('/upload', (req, res) => {
    const correlationId = uuidv4();
    const callback = (content: string): void => {
      console.log(content);
      res.send({ hello: 'upload' });
      delete callbacks[correlationId];
    };
    callbacks[correlationId] = callback;
    ch.sendToQueue(QUEUE, Buffer.from('hello'), { correlationId, replyTo: queue });
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
