const sqlite3 = require('sqlite3').verbose();

const DBSOURCE = "db.sqlite";

let db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
      // Cannot open database
      console.error(err.message)
      throw err
    }else{
        console.log('Connected to the SQLite database.');
        db.run(`CREATE TABLE expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item text, 
            amount real, 
            expense_date date,
            category text
            )`,
        (err) => {
            if (err) {
                // Table already created
            }else{
                // Table just created, creating some rows
                const insert = 'INSERT INTO expenses (item, amount, expense_date, category) VALUES (?,?,?,?)'
                db.run(insert, ["Coffee", 2.50, "2025-09-30", "Food"])
                db.run(insert, ["Book", 15.00, "2025-09-29", "Education"])
            }
        });  
    }
});

module.exports = db;
