import cors from 'cors';
import express from 'express';
import { connect } from 'amqplib';

const { CLOUDAMQP_URL, PORT } = process.env;

const execute = async (): Promise<void> => {
  const conn = await connect(CLOUDAMQP_URL);
  const app = express();
  app.use(cors());
  app.get('/', (req, res) => res.send({ hello: 'world' }));
  // eslint-disable-next-line
  app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`));
};
execute();
