const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
}
const db = admin.database();

module.exports = async (req, res) => {
  const ref = db.ref('items');
  try {
    if (req.method === 'GET') {
      const snapshot = await ref.once('value');
      const data = snapshot.val() || {};
      const arrayData = Object.keys(data).map(key => ({ id: key, ...data[key] }));
      return res.status(200).json(arrayData);
    }
    if (req.method === 'POST') {
      const newRef = await ref.push();
      await newRef.set(req.body);
      return res.status(201).json({ id: newRef.key, ...req.body });
    }
    if (req.method === 'PUT') {
      const { id, ...updateData } = req.body;
      await db.ref('items/' + id).update(updateData);
      return res.status(200).json({ success: true });
    }
    if (req.method === 'DELETE') {
      const { id } = req.query;
      await db.ref('items/' + id).remove();
      return res.status(200).json({ success: true });
    }
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
