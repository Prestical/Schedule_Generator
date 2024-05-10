const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const morgan = require('morgan');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(morgan('dev'));
app.use(express.json());
app.use(express.static('src'));

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'src', 'index.html'));
});

app.post('/update-data', async (req, res) => {
  const { filePath, content } = req.body;
  try {
    if (path.isAbsolute(filePath) || filePath.includes('..')) {
      throw new Error('Invalid file path');
    }

    await fs.writeFile(path.join(__dirname, 'data', filePath), content, 'utf8');
    res.send({ message: 'File updated succesfuly' });
  } catch (error) {
    console.error('File error:', error);
    res.status(500).send({ error: 'Failed to write file' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});