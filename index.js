import express from "express";
import cors from "cors";
import sqlite3 from "sqlite3";

// 創建 Express 應用
const app = express();
const port = 3000;

// 使用 JSON 中間件來解析 JSON 請求
app.use(express.json(), cors());

// 創建 SQLite 資料庫連接
const db = new sqlite3.Database("./example.db", (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log("Connected to the example SQLite database.");
    initializeDatabase();
  }
});

// 初始化資料庫
function initializeDatabase() {
  db.run(
    `CREATE TABLE IF NOT EXISTS avocado (
        date INTEGER PRIMARY KEY,
        highPrice FLOAT NOT NULL, 
        mediumPrice FLOAT NOT NULL,
        lowPrice FLOAT NOT NULL 
    )`,
    (err) => {
      if (err) {
        return console.error(err.message);
      }

      // 開始一個事務
      db.run("BEGIN TRANSACTION");

      // 插入多筆資料
      const data = [
        { date: 15, highPrice: 149.9, mediumPrice: 94.8, lowPrice: 68.1 },
        { date: 16, highPrice: 142.6, mediumPrice: 110.9, lowPrice: 79.4 },
        { date: 17, highPrice: 126.9, mediumPrice: 94.7, lowPrice: 74.2 },
        { date: 18, highPrice: 134.6, mediumPrice: 98.0, lowPrice: 75.2 },
        { date: 19, highPrice: 129.4, mediumPrice: 102.0, lowPrice: 80.1 },
      ];

      const stmt = db.prepare(
        `INSERT INTO avocado (date, highPrice, mediumPrice, lowPrice) VALUES (?, ?, ?, ?)`,
      );

      for (const item of data) {
        stmt.run(
          item.date,
          item.highPrice,
          item.mediumPrice,
          item.lowPrice,
          (err) => {
            if (err) {
              return console.error(err.message);
            }
          },
        );
      }

      stmt.finalize();

      // 提交事務
      db.run("COMMIT", (err) => {
        if (err) {
          return console.error(err.message);
        }
        console.log("Transaction committed successfully.");
      });
    },
  );
}

// 獲取所有用戶 API
app.get("/getData", async (req, res) => {
  const { date } = req.query;
  const date2 = parseInt(date);
  console.log("date: ", date2);
  if (!date2) {
    return res.status(400).json({ error: "Date is required" });
  }

  const query =
    "SELECT highPrice, mediumPrice, lowPrice FROM avocado WHERE date = ?";
  db.all(query, [date2], (err, rows) => {
    if (err) {
      console.log("ERROR", err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// 啟動伺服器
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// 關閉資料庫連接時處理應用程序退出
process.on("SIGINT", () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log("Close the database connection.");
    process.exit(0);
  });
});
