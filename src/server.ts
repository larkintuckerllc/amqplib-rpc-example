/* eslint-disable no-console */
import { connect, ConsumeMessage } from 'amqplib';
import cors from 'cors';
import express from 'express';
import uuidv4 from 'uuid/v4';

interface Callbacks {
  [key: string]: (content: string) => void;
}

const { CLOUDAMQP_URL, PORT } = process.env;
const QUEUE = 'tasks';

const delay = (): Promise<void> =>
  new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, 1000);
  });

const callbacks: Callbacks = {};

const execute = async (): Promise<void> => {
  // AMQP INITIALIZE
  const conn = await connect(CLOUDAMQP_URL);
  const ch = await conn.createChannel();
  await ch.assertQueue(QUEUE);
  const { queue } = await ch.assertQueue('', {
    exclusive: true,
  });

  // CONSUME WORKER RESPONSES
  const handleConsume = async (msg: ConsumeMessage): Promise<void> => {
    if (msg === null) {
      return;
    }
    const {
      content,
      properties: { correlationId },
    } = msg;
    if (callbacks[correlationId] !== undefined) {
      callbacks[correlationId](content.toString());
    }
    ch.ack(msg);
  };
  ch.consume(queue, handleConsume);

  // EXPRESS SETUP
  const app = express();
  app.use(cors());
  app.get('/', async (req, res) => {
    const correlationId = uuidv4();
    const callback = (content: string): void => {
      res.send(content);
      delete callbacks[correlationId];
    };
    callbacks[correlationId] = callback;
    ch.sendToQueue(QUEUE, Buffer.from('hello'), { correlationId, replyTo: queue });

    // HANDLE WORKER NOT COMPLETING
    await delay();
    if (callbacks[correlationId] !== undefined) {
      res.status(500).send();
      delete callbacks[correlationId];
    }
  });
  app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`));

  // AMQP SHUTDOWN
  const handleSIGTERM = async (): Promise<void> => {
    await conn.close();
    process.exit(1);
  };
  process.on('SIGTERM', handleSIGTERM);
};
execute();
