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
                db.run(insert, ["กาแฟ", 85.00, "2025-10-01", "อาหาร"])
                db.run(insert, ["ค่ารถเมล์", 15.00, "2025-10-01", "เดินทาง"])
                db.run(insert, ["ข้าวกล่อง", 45.00, "2025-09-30", "อาหาร"])
                db.run(insert, ["เสื้อยืด", 350.00, "2025-09-29", "ซื้อของ"])
                db.run(insert, ["ค่าไฟฟ้า", 850.00, "2025-09-28", "ค่าบิล"])
            }
        });  
    }
});

module.exports = db;
