import { connect, ConsumeMessage } from 'amqplib';

const { CLOUDAMQP_URL } = process.env;
const QUEUE = 'tasks';

const execute = async (): Promise<void> => {
  const conn = await connect(CLOUDAMQP_URL);
  const ch = await conn.createChannel();
  ch.assertQueue(QUEUE);
  const handleConsume = (msg: ConsumeMessage): void => {
    if (msg === null) {
      return;
    }
    console.log(msg.content.toString());
    ch.ack(msg);
  };
  ch.consume(QUEUE, handleConsume);
};
execute();
