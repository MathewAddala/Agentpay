import sqlite3

conn = sqlite3.connect("/app/data/commerce.db")
conn.execute("DELETE FROM store_policies WHERE value = 'hi' OR key LIKE '%hi%' OR label LIKE '%hi%' OR key LIKE '%policy_%'")
conn.commit()
print("Cleaned policies successfully! Remaining active policies:")
for row in conn.execute("SELECT id, key, label, value, discount_pct FROM store_policies"):
    print(row)
conn.close()
