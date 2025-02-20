import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import multer from 'multer';

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "secrets",
  password: "savetrees",
  port: 5432,
});
db.connect();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("home.ejs");
});

app.get("/login", (req, res) => {
  res.render("login.ejs", { error: null });
});

app.get("/dashboard", (req, res) => {
  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const currentTime = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  res.render("dashboard.ejs", { currentDate: currentDate, currentTime: currentTime });
});

app.get("/pcn", (req, res) => {
  res.render("pcn.ejs");
});

app.get("/pcnlist", (req, res) => {
  db.query(`SELECT * FROM pcn`, (err, result) => {
    if (!err) {
      res.render('pcnlist', { data: result.rows });
    } else {
      console.log(err.message);
      res.status(500).send('An error occurred');
    }
  });
});

app.post("/login", async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;

  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      const storedPassword = user.password;
      const uname = user.name;

      if (password === storedPassword) {
        const currentDate = new Date().toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
        const currentTime = new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        });
        res.render("dashboard.ejs", { username: uname, currentDate: currentDate, currentTime: currentTime });
      } else {
        res.render("login", { error: "Incorrect Password" });
      }
    } else {
      res.render("login", { error: "User not found" });
    }
  } catch (err) {
    console.log(err);
  }
});

// Render the txnform.ejs file
app.get("/txnform", (req, res) => {
  res.render("txnform.ejs");
});

// Handle form submission from txnform.ejs
app.post('/txnform-submit', upload.single('supp_doc'), async (req, res) => {
  const {
    functional_module, mod_name, name, mob_no, email, ass_dt,
    tow, priority, projname, pri_type, task_des, poc
  } = req.body;

  const supp_doc = req.file ? req.file.buffer : null;

  try {
    const result = await db.query(
      'INSERT INTO txnform (functional_module, mod_name, name, mob_no, email, ass_dt, tow, priority, projname, pri_type, task_des, poc, supp_doc) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id',
      [functional_module, mod_name, name, mob_no, email, ass_dt, tow, priority, projname, pri_type, task_des, poc, supp_doc]
    );
    const serialid = result.rows[0].id;
    res.status(200).json({ success: true, sid: serialid, message: 'Form submitted successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error saving data' });
  }
});

app.post('/submit', upload.single('supp_doc'), async (req, res) => {
  const {
    name, emp_code, email, mob_no, company, dept, toa,
    req_dt, pri_mod, sec_mod, req_det, res_req, bus_benefit
  } = req.body;

  const supp_doc = req.file ? req.file.buffer : null;

  try {
    const result = await db.query(
      'INSERT INTO pcn (name, emp_code, email, mob_no, company, dept, toa, req_dt, pri_mod, sec_mod, req_det, res_req, bus_benefit, supp_doc) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id',
      [name, emp_code, email, mob_no, company, dept, toa, req_dt, pri_mod, sec_mod, req_det, res_req, bus_benefit, supp_doc]
    );
    const serialid = result.rows[0].id;
    res.status(200).json({ success: true, sid: serialid, message: 'Form submitted successfully! Your PCN id is:' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error saving data' });
  }
});


app.get('/entries/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM pcn WHERE id = $1', [req.params.id]);
    if (result.rows.length > 0) {
      res.render('pcnview', { entry: result.rows[0] });
    } else {
      res.status(404).send('Not Found');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
