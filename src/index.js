const express = require('express');
const cors = require('cors');
const { htmlToRicos } = require('./converter');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.get('/', (req, res) => {
  res.send({
    message: 'HTML to Ricos API',
    endpoints: [
      {
        path: '/convert',
        method: 'POST',
        description: 'Convert HTML to Ricos format',
        body: {
          html: 'Your HTML content here'
        }
      }
    ]
  });
});

// Convert HTML to Ricos endpoint
app.post('/convert', (req, res) => {
  try {
    // Get HTML from request body
    const { html } = req.body;
    
    if (!html) {
      return res.status(400).json({
        error: 'HTML content is required',
        message: 'Please provide HTML content in the request body as { "html": "your html here" }'
      });
    }
    
    // Convert HTML to Ricos
    const ricosContent = htmlToRicos(html);
    
    // Return Ricos JSON
    return res.json(ricosContent);
  } catch (error) {
    console.error('Error converting HTML to Ricos:', error);
    return res.status(500).json({
      error: 'Error converting HTML to Ricos',
      message: error.message
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`HTML to Ricos API running on port ${PORT}`);
}); 