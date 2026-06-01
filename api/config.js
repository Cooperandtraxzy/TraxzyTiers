module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  // Expose only the anonymous/public key to the client. Do NOT expose service_role keys.
  const clientKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || '';
  res.send(`
    window.SUPABASE_URL = "${process.env.SUPABASE_URL}";
    window.SUPABASE_KEY = "${clientKey}";
  `);
};
