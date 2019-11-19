/* eslint-disable no-console */
import { connect, ConsumeMessage } from 'amqplib';

const { CLOUDAMQP_URL } = process.env;
const QUEUE = 'tasks';

const execute = async (): Promise<void> => {
  // AMQP INITIALIZE
  const conn = await connect(CLOUDAMQP_URL);
  const ch = await conn.createChannel();
  ch.assertQueue(QUEUE);

  // CONSUME SERVER REQUESTS
  const handleConsume = async (msg: ConsumeMessage): Promise<void> => {
    if (msg === null) {
      return;
    }
    const {
      content,
      properties: { correlationId, replyTo },
    } = msg;
    const contentStr = content.toString();
    ch.sendToQueue(replyTo, Buffer.from(`${contentStr} world`), { correlationId });
    ch.ack(msg);
  };
  ch.consume(QUEUE, handleConsume);

  // AMQP SHUTDOWN
  const handleSIGTERM = async (): Promise<void> => {
    await conn.close();
    process.exit(1);
  };
  process.on('SIGTERM', handleSIGTERM);
};
execute();
