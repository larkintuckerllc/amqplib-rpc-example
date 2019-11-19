import { connect, ConsumeMessage } from 'amqplib';

const { CLOUDAMQP_URL } = process.env;
const QUEUE = 'tasks';

const execute = async (): Promise<void> => {
  const conn = await connect(CLOUDAMQP_URL);
  const ch = await conn.createChannel();
  ch.assertQueue(QUEUE);
  const handleConsume = async (msg: ConsumeMessage): Promise<void> => {
    if (msg === null) {
      return;
    }
    const {
      content,
      properties: { correlationId, replyTo },
    } = msg;
    console.log(content.toString());
    ch.sendToQueue(replyTo, Buffer.from('world'), { correlationId });
    ch.ack(msg);
  };
  ch.consume(QUEUE, handleConsume);
  const handleSIGTERM = async (): Promise<void> => {
    await conn.close();
    process.exit(1);
  };
  process.on('SIGTERM', handleSIGTERM);
};
execute();
