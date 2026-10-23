const express = require('express');
const app = express();
app.use(express.json());

app.get('/api/skills', (req, res) => {
  res.json({ message: 'Skills API active' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
