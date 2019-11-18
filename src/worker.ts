import { connect, ConsumeMessage } from 'amqplib';

const { CLOUDAMQP_URL } = process.env;
const QUEUE = 'tasks';

const delay = (): Promise<void> =>
  new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, 5000);
  });

const execute = async (): Promise<void> => {
  const conn = await connect(CLOUDAMQP_URL);
  const ch = await conn.createChannel();
  ch.assertQueue(QUEUE);
  const handleConsume = async (msg: ConsumeMessage): Promise<void> => {
    if (msg === null) {
      return;
    }
    await delay();
    console.log(msg.content.toString());
    ch.ack(msg);
  };
  ch.consume(QUEUE, handleConsume);
};
execute();
