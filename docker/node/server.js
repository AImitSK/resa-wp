const express = require('express');

const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'ism-pdf-service' });
});

// Platzhalter: PDF-Generierung wird hier später implementiert
app.post('/api/pdf/generate', (_req, res) => {
  res.status(501).json({
    error: 'not_implemented',
    message: 'PDF-Generierung wird noch implementiert.',
  });
});

app.listen(PORT, () => {
  console.log(`ISM PDF-Service läuft auf Port ${PORT}`);
});
