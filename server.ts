import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPANEL_BASE_URL = 'https://admin.upanel.top/api';
const UPANEL_API_KEY = 'cuXkzhlOZqcPjvC5q6gjVdfP5TLbN1L2';

// Helper to get settings for a website
async function getWebsiteSettings(id: string) {
  const [rows] = await pool.execute('SELECT * FROM website_settings WHERE id = ?', [id]);
  return (rows as any[])[0];
}

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'sql12.freesqldatabase.com',
  user: process.env.DB_USER || 'sql12820987',
  password: process.env.DB_PASS || 'f3YHIReSBh',
  database: process.env.DB_NAME || 'sql12820987',
  port: parseInt(process.env.DB_PORT || '3306'),
  charset: 'utf8mb4',
};

let pool: mysql.Pool;

async function initDb() {
  try {
    pool = mysql.createPool(dbConfig);
    
    // Create articles table
    const createArticlesTableQuery = `
      CREATE TABLE IF NOT EXISTS articles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        website_name VARCHAR(255),
        topic TEXT,
        focus_keyword VARCHAR(255),
        primary_keyword VARCHAR(255),
        seo_title TEXT,
        seo_slug TEXT,
        meta_description TEXT,
        meta_keywords TEXT,
        website_tags TEXT,
        article_content LONGTEXT,
        analysis_summary TEXT,
        seo_audit TEXT,
        sources TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `;
    await pool.execute(createArticlesTableQuery);

    // Create settings table
    const createSettingsTableQuery = `
      CREATE TABLE IF NOT EXISTS website_settings (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255),
        api_url TEXT,
        api_key TEXT,
        sheet_link TEXT,
        script_link TEXT,
        gemini_api_key TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `;
    await pool.execute(createSettingsTableQuery);

    // Add script_link column if it doesn't exist (for existing tables)
    try {
      await pool.execute('ALTER TABLE website_settings ADD COLUMN script_link TEXT AFTER sheet_link');
    } catch (e) {
      // Column might already exist
    }

    // Add gemini_api_key column if it doesn't exist (for existing tables)
    try {
      await pool.execute('ALTER TABLE website_settings ADD COLUMN gemini_api_key TEXT AFTER script_link');
    } catch (e) {
      // Column might already exist
    }

    // Initialize default settings if empty
    const [settingsRows] = await pool.execute('SELECT COUNT(*) as count FROM website_settings');
    if ((settingsRows as any)[0].count === 0) {
      const defaultSettings = [
        ['zizme', 'Zizme', '', '', 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT5OFlc7uRCS04j50MjuMydJnJWFywggyxmBPCvuL7_oKe5Yf1pt4OSzMp1kHg1jpUYJHmvVka3qlw5/pub?gid=446634042&single=true&output=csv', ''],
        ['xacot', 'Xacot', '', '', 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT5OFlc7uRCS04j50MjuMydJnJWFywggyxmBPCvuL7_oKe5Yf1pt4OSzMp1kHg1jpUYJHmvVka3qlw5/pub?gid=781783351&single=true&output=csv', ''],
        ['eallinfo', 'Eallinfo', '', '', 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT5OFlc7uRCS04j50MjuMydJnJWFywggyxmBPCvuL7_oKe5Yf1pt4OSzMp1kHg1jpUYJHmvVka3qlw5/pub?gid=1232980191&single=true&output=csv', ''],
        ['upanel', 'Upanel', 'https://admin.upanel.top/api', 'cuXkzhlOZqcPjvC5q6gjVdfP5TLbN1L2', 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT5OFlc7uRCS04j50MjuMydJnJWFywggyxmBPCvuL7_oKe5Yf1pt4OSzMp1kHg1jpUYJHmvVka3qlw5/pub?gid=874155132&single=true&output=csv', '']
      ];
      for (const setting of defaultSettings) {
        await pool.execute('INSERT INTO website_settings (id, name, api_url, api_key, sheet_link, script_link) VALUES (?, ?, ?, ?, ?, ?)', setting);
      }
    }

    // Also ensure existing table columns are utf8mb4 if they were created with a different charset
    const alterTableQueries = [
      "ALTER TABLE articles CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
      "ALTER TABLE articles MODIFY topic TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
      "ALTER TABLE articles MODIFY seo_title TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
      "ALTER TABLE articles MODIFY article_content LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
      "ALTER TABLE articles MODIFY analysis_summary TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    ];

    for (const query of alterTableQueries) {
      try {
        await pool.execute(query);
      } catch (e) {
        // Ignore errors if table is already correct or if columns don't match exactly
        console.warn('Alter table warning:', (e as Error).message);
      }
    }

    console.log('Database initialized successfully with utf8mb4 support');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

async function startServer() {
  console.log('Starting server process...');
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Root logger
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

  // Health check for platform
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', database: !!pool });
  });

  // Settings Endpoints
  app.get('/api/settings', async (req, res) => {
    try {
      if (!pool) return res.status(503).json({ error: 'Database initializing, please try again in a moment' });
      const [rows] = await pool.execute('SELECT * FROM website_settings');
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  });

  app.post('/api/settings', async (req, res) => {
    try {
      if (!pool) return res.status(503).json({ error: 'Database initializing' });
      const { id, api_url, api_key, sheet_link, script_link, gemini_api_key } = req.body;
      await pool.execute(
        'UPDATE website_settings SET api_url = ?, api_key = ?, sheet_link = ?, script_link = ?, gemini_api_key = ? WHERE id = ?',
        [api_url, api_key, sheet_link, script_link, gemini_api_key, id]
      );
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update settings' });
    }
  });

  // Google Sheets Proxy
  app.get('/api/sheets/:websiteId', async (req, res) => {
    try {
      const { websiteId } = req.params;
      const settings = await getWebsiteSettings(websiteId);
      if (!settings || !settings.sheet_link) {
        return res.status(404).json({ error: 'Sheet link not found for this website' });
      }

      // Normalize URL: Convert pubhtml to pub?output=csv
      let sheetUrl = settings.sheet_link.trim();
      if (sheetUrl.includes('/pubhtml')) {
        sheetUrl = sheetUrl.split('?')[0].replace('/pubhtml', '/pub') + '?' + (sheetUrl.split('?')[1] || '') + '&output=csv';
      } else if (!sheetUrl.includes('output=csv')) {
        sheetUrl += (sheetUrl.includes('?') ? '&' : '?') + 'output=csv';
      }

      const response = await fetch(sheetUrl);
      const csvData = await response.text();
      
      if (!csvData || csvData.includes('<!DOCTYPE html>')) {
        return res.status(400).json({ error: 'Invalid CSV data. Please ensure the link is a published CSV.' });
      }

      // Robust CSV parsing
      const rows: string[][] = [];
      let currentRow: string[] = [];
      let currentField = '';
      let inQuotes = false;

      // Normalize line endings
      const normalizedData = csvData.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

      for (let i = 0; i < normalizedData.length; i++) {
        const char = normalizedData[i];
        const nextChar = normalizedData[i + 1];

        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            currentField += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          currentRow.push(currentField.trim());
          currentField = '';
        } else if (char === '\n' && !inQuotes) {
          currentRow.push(currentField.trim());
          rows.push(currentRow);
          currentRow = [];
          currentField = '';
        } else {
          currentField += char;
        }
      }
      // Push last field/row if exists
      if (currentField || currentRow.length > 0) {
        currentRow.push(currentField.trim());
        rows.push(currentRow);
      }

      if (rows.length < 2) return res.json([]);

      const headers = rows[0].map(h => h.trim());
      const data = rows.slice(1).map(row => {
        const obj: any = {};
        headers.forEach((header, index) => {
          if (header) {
            obj[header] = row[index] || '';
          }
        });
        return obj;
      });

      // Filter for "To Do" status (case-insensitive and handles extra spaces)
      const filtered = data.filter(item => {
        const status = (item.Status || item.status || '').toString().toLowerCase().trim();
        return status === 'to do';
      });

      res.json(filtered);
    } catch (error) {
      console.error('Sheet proxy error:', error);
      res.status(500).json({ error: 'Failed to fetch sheet data' });
    }
  });

  // Proxy for Upanel Categories (Dynamic)
  app.get('/api/upanel/categories', async (req, res) => {
    try {
      const websiteId = req.query.websiteId as string || 'upanel';
      const settings = await getWebsiteSettings(websiteId);
      const baseUrl = settings?.api_url || UPANEL_BASE_URL;
      const apiKey = settings?.api_key || UPANEL_API_KEY;

      const response = await fetch(`${baseUrl}/categories`, {
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Proxy error (categories):', error);
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  });

  // Proxy for Upanel Subcategories (Dynamic)
  app.get('/api/upanel/categories/:parentId/subcategories', async (req, res) => {
    try {
      const { parentId } = req.params;
      const websiteId = req.query.websiteId as string || 'upanel';
      const settings = await getWebsiteSettings(websiteId);
      const baseUrl = settings?.api_url || UPANEL_BASE_URL;
      const apiKey = settings?.api_key || UPANEL_API_KEY;

      const response = await fetch(`${baseUrl}/categories/${parentId}/subcategories`, {
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Proxy error (subcategories):', error);
      res.status(500).json({ error: 'Failed to fetch subcategories' });
    }
  });

  // Proxy for Upanel Article Creation (Dynamic)
  app.post('/api/upanel/articles', async (req, res) => {
    try {
      const websiteName = req.body.website_name || 'Upanel';
      console.log(`Posting article to Upanel for website: ${websiteName}`);

      // Try to get settings for the current website, fallback to 'upanel'
      let settings = await getWebsiteSettings(websiteName);
      if (!settings?.api_key || !settings?.api_url) {
        // Try matching by name or ID lookup with variations (strip .com, lowercase)
        const nameWithoutCom = websiteName.replace(/\.com$/i, '');
        const [siteRows] = await pool.execute(
          'SELECT * FROM website_settings WHERE name = ? OR id = ? OR name = ? OR id = ?',
          [websiteName, websiteName.toLowerCase(), nameWithoutCom, nameWithoutCom.toLowerCase()]
        );
        settings = (siteRows as any[])[0];
      }
      
      if (!settings?.api_key || !settings?.api_url) {
        settings = await getWebsiteSettings('upanel');
      }

      const baseUrl = settings?.api_url || UPANEL_BASE_URL;
      const apiKey = settings?.api_key || UPANEL_API_KEY;

      console.log(`Using Upanel API: ${baseUrl} with Key: ${apiKey.substring(0, 5)}...`);

      const response = await fetch(`${baseUrl}/articles`, {
        method: 'POST',
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body),
      });
      
      const data = await response.json();
      console.log('Upanel API Response:', JSON.stringify(data));
      
      // If success, try to update Google Sheet status
      if (response.ok && (data.success || data.id)) {
        try {
          const scriptUrl = settings?.script_link;

          if (scriptUrl) {
            // Derive sheet name
            let sheetName = websiteName;
            const lowerName = websiteName.toLowerCase();
            if (lowerName.includes('zizme')) sheetName = 'zizme topic';
            else if (lowerName.includes('xacot')) sheetName = 'xacot topic';
            else if (lowerName.includes('eallinfo')) sheetName = 'eallinfo topic';
            else if (lowerName.includes('upanel')) sheetName = 'upanel';

            console.log(`Triggering sheet update: Title="${req.body.topic}", Status="Published", Sheet="${sheetName}", Script="${scriptUrl}"`);

            // Send POST request to Google Apps Script
            const scriptResponse = await fetch(scriptUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                title: req.body.topic,
                status: 'Published',
                sheetName: sheetName
              })
            });
            const scriptResult = await scriptResponse.text();
            console.log('Sheet update result:', scriptResult);
          } else {
            console.log(`No script_link found for ${websiteName}`);
          }
        } catch (err) {
          console.error('Failed to trigger sheet update:', err);
        }
      }
      
      res.status(response.status).json(data);
    } catch (error) {
      console.error('Proxy error (post article):', error);
      res.status(500).json({ error: 'Failed to post article' });
    }
  });

  // Articles History Endpoints
  app.post('/api/articles', async (req, res) => {
    try {
      const { 
        websiteName, topic, focusKeyword, primaryKeyword, 
        seoResult, sources 
      } = req.body;

      const query = `
        INSERT INTO articles (
          website_name, topic, focus_keyword, primary_keyword, 
          seo_title, seo_slug, meta_description, meta_keywords, 
          website_tags, article_content, analysis_summary, 
          seo_audit, sources
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        websiteName, topic, focusKeyword, primaryKeyword,
        seoResult.seoTitle, seoResult.seoSlug, seoResult.metaDescription, 
        seoResult.metaKeywords, JSON.stringify(seoResult.websiteTags), 
        seoResult.articleContent, seoResult.analysisSummary, 
        JSON.stringify(seoResult.seoAudit), JSON.stringify(sources)
      ];

      const [result] = await pool.execute(query, values);
      res.json({ success: true, id: (result as any).insertId });
    } catch (error) {
      console.error('Database error (save article):', error);
      res.status(500).json({ error: 'Failed to save article' });
    }
  });

  app.get('/api/articles', async (req, res) => {
    try {
      if (!pool) return res.status(503).json({ error: 'Database initializing' });
      const [rows] = await pool.execute('SELECT id, website_name, topic, seo_title, created_at FROM articles ORDER BY created_at DESC');
      res.json(rows);
    } catch (error) {
      console.error('Database error (get articles):', error);
      res.status(500).json({ error: 'Failed to fetch articles' });
    }
  });

  app.get('/api/articles/:id', async (req, res) => {
    try {
      if (!pool) return res.status(503).json({ error: 'Database initializing' });
      const { id } = req.params;
      const [rows] = await pool.execute('SELECT * FROM articles WHERE id = ?', [id]);
      const article = (rows as any[])[0];
      
      if (!article) {
        return res.status(404).json({ error: 'Article not found' });
      }

      // Format back to the expected frontend structure
      const formatted = {
        id: article.id,
        websiteName: article.website_name,
        topic: article.topic,
        focusKeyword: article.focus_keyword,
        primaryKeyword: article.primary_keyword,
        seoResult: {
          seoTitle: article.seo_title,
          seoSlug: article.seo_slug,
          metaDescription: article.meta_description,
          metaKeywords: article.meta_keywords,
          websiteTags: JSON.parse(article.website_tags || '[]'),
          articleContent: article.article_content,
          analysisSummary: article.analysis_summary,
          seoAudit: JSON.parse(article.seo_audit || 'null')
        },
        sources: JSON.parse(article.sources || '[]'),
        createdAt: article.created_at
      };

      res.json(formatted);
    } catch (error) {
      console.error('Database error (get article):', error);
      res.status(500).json({ error: 'Failed to fetch article' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Catch-all for SPA
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'), (err) => {
        if (err) {
          console.error('Error sending index.html:', err);
          res.status(500).send('Internal Server Error');
        }
      });
    });
  }

  // Global error handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is listening on 0.0.0.0:${PORT}`);
    console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
    
    // Start DB initialization in background
    console.log('Initializing database in background...');
    initDb()
      .then(() => console.log('Database initialization finished'))
      .catch(err => console.error('Background DB init error:', err));
  });
}

startServer();
