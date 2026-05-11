import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const FHIR_BASE_URL = process.env.FHIR_BASE_URL;
const FHIR_BEARER_TOKEN = process.env.FHIR_BEARER_TOKEN;

if (!FHIR_BASE_URL || !FHIR_BEARER_TOKEN) {
  console.warn("WARNING: FHIR_BASE_URL or FHIR_BEARER_TOKEN is not set in .env");
}

app.use('/fhir', async (req: Request, res: Response) => {
  try {
    const url = `${FHIR_BASE_URL}${req.url}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${FHIR_BEARER_TOKEN}`,
    };

    const options: RequestInit = {
      method: req.method,
      headers,
    };

    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      options.body = JSON.stringify(req.body);
    }

    const response = await fetch(url, options);
    const data = await response.json().catch(() => null);

    res.status(response.status).json(data);
  } catch (error: any) {
    console.error('FHIR Proxy Error:', error.message);
    res.status(500).json({ error: 'FHIR Proxy Error', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Backend proxy running at http://localhost:${port}`);
});
