// const express = require('express');
// const path = require('path');
// const app = express();
// const PORT = process.env.PORT || 5000;

// // Serve static files
// app.use(express.static(path.join(__dirname, '../public')));

// // Basic API endpoint
// app.get('/api/hello', (req, res) => {
//   res.json({ message: 'Hello from Yoya Coffee API!' });
// });

// // Catch-all route to serve index.html for client-side routing
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, '../public/index.html'));
// });

// // Start server
// app.listen(PORT, '0.0.0.0', () => {
//   console.log(`Yoya Coffee server running at http://0.0.0.0:${PORT}/`);
// });