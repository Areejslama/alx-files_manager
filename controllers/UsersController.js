import sha1 from 'sha1';
import Queue from 'bull';
import dbClient from '../utils/db';

class UsersController {
  static async postNew(req, res) {
    const queue = new Queue('userQueue');
    const { email, password } = req.body;

    // Validate the email and password
    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    // Access the users collection
    const users = await dbClient.db.collection('users');

    try {
      // Check if the user already exists
      const userExists = await users.findOne({ email });
      if (userExists) {
        return res.status(400).json({ error: 'Already exist' });
      }

      // Hash the password and insert the new user
      const hashedPassword = sha1(password);
      const { insertedId } = await users.insertOne({ email, password: hashedPassword });
      const user = { id: insertedId, email };

      // Add the new user to the queue
      queue.add({ userId: insertedId });

      // Return the newly created user
      return res.status(201).json(user);
    } catch (err) {
      // Handle any potential database or server errors
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

export default UsersController;
