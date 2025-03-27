# HTML to Ricos API

A simple Node.js API that converts HTML content to Wix Ricos format. This API is designed to be deployed on Railway.app and used with n8n workflows.

## Features

- Converts HTML content to Ricos JSON format
- Preserves formatting, styling, and structure
- Handles images, tables, lists, and other complex HTML elements
- Provides a simple REST API endpoint
- Works with n8n workflows

## Prerequisites

- Node.js 14+
- npm or yarn

## Local Development

1. Clone this repository:
```
git clone https://github.com/yourusername/html-to-ricos-api.git
cd html-to-ricos-api
```

2. Install dependencies:
```
npm install
```

3. Start the development server:
```
npm run dev
```

4. The API will be available at http://localhost:3000

## API Endpoints

### Convert HTML to Ricos

**Endpoint:** `POST /convert`

**Request Body:**
```json
{
  "html": "<p>Your HTML content here</p>"
}
```

**Response:**
```json
{
  "nodes": [
    {
      "type": "PARAGRAPH",
      "id": "abc123",
      "nodes": [
        {
          "type": "TEXT",
          "id": "",
          "textData": {
            "text": "Your HTML content here"
          }
        }
      ]
    }
  ]
}
```

## Deployment to Railway.app

1. Create a new project on [Railway.app](https://railway.app/)

2. Connect your GitHub repository or use the Railway CLI to deploy

3. Set the following environment variables if needed:
   - `PORT`: The port to run the server on (default: 3000)

4. Deploy the application

## Using with n8n

### Example n8n HTTP Request Node Configuration:

1. Create an HTTP Request node in your n8n workflow
2. Configure it as follows:
   - **Method:** POST
   - **URL:** https://your-railway-app-url.railway.app/convert
   - **Headers:** `Content-Type: application/json`
   - **Body:** `{"html": "{{$node["Previous Node"].json.htmlContent}}"}`
   - **Response Format:** JSON

3. The output will contain the Ricos JSON structure ready to be used in your Wix API calls

## License

MIT 