import { connect, ConsumeMessage } from 'amqplib';

const { CLOUDAMQP_URL } = process.env;
const QUEUE_TASKS = 'tasks';
const QUEUE_RESULTS = 'results';

const execute = async (): Promise<void> => {
  const conn = await connect(CLOUDAMQP_URL);
  const ch = await conn.createChannel();
  ch.assertQueue(QUEUE_TASKS);
  ch.assertQueue(QUEUE_RESULTS);
  const handleConsume = async (msg: ConsumeMessage): Promise<void> => {
    if (msg === null) {
      return;
    }
    console.log(msg.content.toString());
    ch.sendToQueue(QUEUE_RESULTS, Buffer.from('world'));
    ch.ack(msg);
  };
  ch.consume(QUEUE_TASKS, handleConsume);
  const handleSIGTERM = async (): Promise<void> => {
    await conn.close();
    process.exit(1);
  };
  process.on('SIGTERM', handleSIGTERM);
};
execute();
