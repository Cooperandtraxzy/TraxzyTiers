const path = require('path');
const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 3000;

/**
 * ENV (support both naming styles to avoid breaking deployment)
 */
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Serve frontend files
 */
app.use(express.static(path.join(__dirname)));

/**
 * API: Players
 * (your frontend can still use direct Supabase OR this endpoint)
 */
app.get('/api/players', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('players')
      .select('*');

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to fetch players' });
    }

    res.json(data || []);
  } catch (err) {
    console.error('Unexpected server error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Optional: also support direct REST-style endpoint (for compatibility)
 */
app.get('/rest/v1/players', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('players')
      .select('*');

    if (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to fetch players' });
    }

    res.json(data || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Start server
 */
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});