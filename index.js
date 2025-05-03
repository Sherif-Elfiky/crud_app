const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();


app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));


const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.get('/jobs', async (req, res) => {
  const result = await pool.query('SELECT * FROM jobs');
  const jobs = result.rows;

  res.send(`
  <!DOCTYPE html>
  <html>
  <head>
    <title>Jobs</title>
    <link rel="stylesheet" href="/styles.css">
  </head>
  <body>
    <h1>Jobs</h1>
    <ol>
      ${jobs.map(job => `
        <li>
          ${job.company} - ${job.position}
          <form method="POST" action="/jobs/update" style="display:inline;">
            <input type="hidden" name="id" value="${job.id}">
            <select name="status" onchange="this.form.submit()">
              <option value="applied" ${job.status === 'applied' ? 'selected' : ''}>Applied</option>
              <option value="interviewing" ${job.status === 'interviewing' ? 'selected' : ''}>Interviewing</option>
              <option value="hired" ${job.status === 'hired' ? 'selected' : ''}>Hired</option>
            </select>
          </form>
          <form method="POST" action="/jobs/delete" style="display:inline;">
            <input type="hidden" name="id" value="${job.id}">
            <button type="submit">Delete</button>
          </form>
        </li>
      `).join('')}
    </ol>
    <a href="/">← Home</a>
  </body>
  </html>
`);
});



app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <link rel="stylesheet" href="/styles.css">
      </head>
      <body>
        <h1>Add Jobs</h1>
        <p><strong>Add the company</strong>, <strong>position</strong>, and <strong>status</strong></p>
        <form method="POST" action="/jobs">
          <input name="company" placeholder="Company" required />
          <input name="position" placeholder="Position" required />
          <select name="status" required>
            <option value="applied">Applied</option>
            <option value="interviewing">Interviewing</option>
            <option value="hired">Hired</option>
          </select>
          <button type="submit">add</button>
        </form>
      </body>
    </html>
  `);
});

app.post('/jobs', async (req, res) => {
  const { company, position, status } = req.body;

  try {
    await pool.query(
      'INSERT INTO jobs (company, position, status, applied_at) VALUES ($1, $2, $3, NOW())',
      [company, position, status]
    );
    res.redirect('/jobs'); 
  } catch (err) {
    console.error(err);
    res.status(500).send('Error adding job');
  }
});


app.post('/jobs/delete', async (req, res) => {
  const { id } = req.body;
  try {
    await pool.query('DELETE FROM jobs WHERE id = $1', [id]);
    res.redirect('/jobs');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting job');
  }
});


app.post('/jobs/update', async (req, res) => {
  const { id, status } = req.body;
  try {
    await pool.query('UPDATE jobs SET status = $1 WHERE id = $2', [status, id]);
    res.redirect('/jobs');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating job status');
  }
});







const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
