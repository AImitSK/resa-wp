const express = require('express');
const puppeteer = require('puppeteer-core');

const app = express();
const PORT = 3000;

// 50 MB limit for large HTML templates with embedded images.
app.use(express.json({ limit: '50mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'resa-pdf-service' });
});

app.post('/api/pdf/generate', async (req, res) => {
  const { html, format = 'A4', margins } = req.body;

  if (!html) {
    return res.status(400).json({ error: 'missing_html', message: 'HTML content is required.' });
  }

  const defaultMargins = {
    top: '20mm',
    right: '15mm',
    bottom: '25mm',
    left: '15mm',
  };

  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    const pdfBuffer = await page.pdf({
      format,
      margin: margins || defaultMargins,
      printBackground: true,
      preferCSSPageSize: true,
    });

    res.set('Content-Type', 'application/pdf');
    res.send(Buffer.from(pdfBuffer));
  } catch (err) {
    console.error('PDF generation error:', err.message);
    res.status(500).json({
      error: 'generation_failed',
      message: err.message,
    });
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
});

app.listen(PORT, () => {
  console.log(`RESA PDF-Service running on port ${PORT}`);
});
