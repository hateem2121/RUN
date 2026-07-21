module.exports = {
  url: () => 'http://localhost:5002/',
  action: async (page) => {
    // Wait for the page to load
    await new Promise(r => setTimeout(r, 2000));
    // Guaranteed client-side routing
    await page.evaluate(() => {
      window.__navigate('/admin');
    });
    await new Promise(r => setTimeout(r, 3000));
  },
  back: async (page) => {
    // Guaranteed client-side routing back to home
    await page.evaluate(() => {
      window.__navigate('/');
    });
    // Wait for home page to render
    await new Promise(r => setTimeout(r, 3000));
  },
  leakFilter: (node) => {
    return true; 
  }
};
