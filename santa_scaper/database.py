import psycopg2

# Reemplaza estos valores con los de tu proyecto Supabase
host = "TU_HOST.supabase.co"
database = "postgres"
user = "TU_USUARIO"
password = "TU_PASSWORD"
port = 5432

conn = psycopg2.connect(
    host=host,
    database=database,
    user=user,
    password=password,
    port=port
)

cur = conn.cursor()
cur.execute("SELECT version();")
print(cur.fetchone())

cur.close()
conn.close()