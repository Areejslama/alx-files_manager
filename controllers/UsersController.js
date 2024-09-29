import sha1 from 'sha1';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import Queue from 'bull';

class UsersController {
  // eslint-disable-next-line consistent-return
  static async postNew(req, res) {
    const queue = new Queue('userQueue');
    const { email, password } = req.body;
    if (!email) return res.status(400).json({ error: 'Missing email' });
    if (!password) return res.status(400).json({ error: 'Missing password' });

    const users = await dbClient.db.collection('users');
    users.findOne({ email }, async (err, result) => {
      if (result) {
        return res.status(400).json({ error: 'Already exist' });
      }
      const hashedPassword = sha1(password);
      const { insertedId } = await users.insertOne({ email, password: hashedPassword });
      const user = { id: insertedId, email };
      queue.add({ userId: insertedId });
      return res.status(201).json(user);
    });
  }
