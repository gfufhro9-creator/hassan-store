const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://user:password@localhost:5432/hassan_store',
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

pool.query(`
  CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    player_id VARCHAR(100) NOT NULL,
    package_name VARCHAR(100) NOT NULL,
    price VARCHAR(50) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    receipt_number VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'قيد المراجعة',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).catch(err => console.error("Database table creation error:", err));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Hassan Store - شحن فري فاير</title>
        <style>
            body { font-family: Tahoma, sans-serif; background: #0f172a; color: #fff; margin: 0; padding: 20px; text-align: center; }
            .container { max-width: 500px; margin: auto; background: #1e293b; padding: 20px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); }
            h1 { color: #38bdf8; }
            .package { background: #334155; padding: 15px; margin: 10px 0; border-radius: 8px; cursor: pointer; border: 2px solid transparent; transition: 0.3s; }
            .package.selected { border-color: #38bdf8; background: #1e293b; }
            input, select { width: 90%; padding: 12px; margin: 10px 0; border-radius: 6px; border: none; background: #0f172a; color: #fff; font-size: 16px; }
            button { background: #0284c7; color: white; border: none; padding: 12px 20px; font-size: 18px; border-radius: 6px; cursor: pointer; width: 100%; font-weight: bold; margin-top: 15px; }
            .admin-link { display: block; margin-top: 20px; color: #94a3b8; text-decoration: none; font-size: 14px; }
            .payment-info { background: #0f172a; padding: 10px; border-radius: 6px; margin: 10px 0; font-size: 14px; color: #facc15; text-align: right; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🔥 Hassan Store 🔥</h1>
            <p>متجرك الموثوق لشحن جواهر فري فاير بالسودان</p>
            
            <form action="/order" method="POST">
                <h3>1. اختر الباقة المطلوبة:</h3>
                <div class="package" onclick="selectPkg(this, '100 جوهرة', '2500 جنيه')">
                    <strong>100 جوهرة 💎</strong> - 2500 ج.س
                </div>
                <div class="package" onclick="selectPkg(this, '310 جوهرة', '7000 جنيه')">
                    <strong>310 جوهرة 💎</strong> - 7000 ج.س
                </div>
                <div class="package" onclick="selectPkg(this, '520 جوهرة', '11500 جنيه')">
                    <strong>520 جوهرة 💎</strong> - 11500 ج.س
                </div>
                
                <input type="hidden" name="package_name" id="pkg_name" required>
                <input type="hidden" name="price" id="pkg_price" required>

                <h3>2. أدخل آي دي (Player ID) فري فاير:</h3>
                <input type="text" name="player_id" placeholder="أدخل رقم الـ ID هنا" required>

                <h3>3. اختر طريقتك للدفع:</h3>
                <select name="payment_method" id="pay_method" onchange="updatePaymentInfo()" required>
                    <option value="">-- اختر طريقة الدفع --</option>
                    <option value="بنكك">بنكك (Bankak)</option>
                    <option value="ماي كاشي">ماي كاشي (My Cash)</option>
                </select>

                <div id="payment_details" class="payment-info" style="display:none;"></div>

                <h3>4. أدخل رقم الإيصال أو التحويل:</h3>
                <input type="text" name="receipt_number" placeholder="رقم عملية التحويل" required>

                <button type="submit">تأكيد وإرسال الطلب 🚀</button>
            </form>

            <a href="/admin" class="admin-link">🛠️ الدخول لوحة التحكم (الإدارة)</a>
        </div>

        <script>
            function selectPkg(element, name, price) {
                document.querySelectorAll('.package').forEach(p => p.classList.remove('selected'));
                element.classList.add('selected');
                document.getElementById('pkg_name').value = name;
                document.getElementById('pkg_price').value = price;
            }

            function updatePaymentInfo() {
                const method = document.getElementById('pay_method').value;
                const infoDiv = document.getElementById('payment_details');
                if (method === 'بنكك') {
                    infoDiv.style.display = 'block';
                    infoDiv.innerHTML = 'حوّل المبلغ على حساب بنكك: <b>3512545</b><br>باسم: <b>عمر محمد قمر</b>';
                } else if (method === 'ماي كاشي') {
                    infoDiv.style.display = 'block';
                    infoDiv.innerHTML = 'حوّل المبلغ على ماي كاشي: <b>401657660</b><br>باسم: <b>حسن عمر محمد</b>';
                } else {
                    infoDiv.style.display = 'none';
                }
            }
        </script>
    </body>
    </html>
  `);
});

app.post('/order', async (req, res) => {
  const { player_id, package_name, price, payment_method, receipt_number } = req.body;
  try {
    await pool.query(
      'INSERT INTO orders (player_id, package_name, price, payment_method, receipt_number) VALUES ($1, $2, $3, $4, $5)',
      [player_id, package_name, price, payment_method, receipt_number]
    );
    res.send(`
      <html lang="ar" dir="rtl">
      <head><meta charset="UTF-8"><title>تم الطلب</title></head>
      <body style="background:#0f172a; color:#fff; text-align:center; padding-top:50px; font-family:Tahoma;">
          <h1 style="color:#22c55e;">تم إرسال طلبك بنجاح! 🎉</h1>
          <p>جاري مراجعة التحويل وشحن الجواهر لحسابك في أسرع وقت.</p>
          <a href="/" style="color:#38bdf8; text-decoration:none; font-size:18px;">العودة للمتجر 🏠</a>
      </body>
      </html>
    `);
  } catch (err) {
    console.error(err);
    res.status(500).send('حدث خطأ أثناء حفظ الطلب.');
  }
});

app.get('/admin', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    let rowsHtml = '';
    result.rows.forEach(row => {
      rowsHtml += `
        <tr>
          <td>${row.id}</td>
          <td><b>${row.player_id}</b></td>
          <td>${row.package_name} (${row.price})</td>
          <td>${row.payment_method}</td>
          <td>${row.receipt_number}</td>
          <td style="color:${row.status === 'مكتمل' ? '#22c55e' : '#facc15'};">${row.status}</td>
          <td>
            ${row.status !== 'مكتمل' ? `<form action="/admin/complete/${row.id}" method="POST" style="margin:0;"><button type="submit" style="background:#22c55e; color:#fff; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">تم الشحن ✅</button></form>` : 'تم الشحن'}
          </td>
        </tr>
      `;
    });

    res.send(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
          <meta charset="UTF-8">
          <title>لوحة تحكم Hassan Store</title>
          <style>
              body { font-family: Tahoma, sans-serif; background: #0f172a; color: #fff; padding: 20px; }
              h1 { color: #38bdf8; text-align: center; }
              table { width: 100%; border-collapse: collapse; background: #1e293b; margin-top: 20px; border-radius: 8px; overflow: hidden; }
              th, td { padding: 12px; border: 1px solid #334155; text-align: center; }
              th { background: #334155; color: #38bdf8; }
              a { color: #38bdf8; text-decoration: none; display: inline-block; margin-bottom: 15px; }
          </style>
      </head>
      <body>
          <h1>🛠️ لوحة تحكم الطلبات - Hassan Store</h1>
          <a href="/">⬅️ العودة لواجهة المتجر</a>
          <table>
              <tr>
                  <th>م</th>
                  <th>الآي دي (Player ID)</th>
                  <th>الباقة والسعر</th>
                  <th>الدفع</th>
                  <th>رقم الإيصال</th>
                  <th>الحالة</th>
                  <th>الإجراء</th>
              </tr>
              ${rowsHtml || '<tr><td colspan="7">لا توجد طلبات حتى الآن</td></tr>'}
          </table>
      </body>
      </html>
    `);
  } catch (err) {
    console.error(err);
    res.status(500).send('خطأ في تحميل لوحة التحكم.');
  }
});

app.post('/admin/complete/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE orders SET status = \'مكتمل\' WHERE id = $1', [id]);
    res.redirect('/admin');
  } catch (err) {
    console.error(err);
    res.status(500).send('خطأ في تحديث الطلب.');
  }
});

app.listen(port, () => {
  console.log(`Hassan Store Server is running on port ${port} 🔥`);
});
