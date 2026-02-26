-- Conectar a Supabase y ejecutar este script
-- psql "postgresql://postgres:Omega101998@db.ybxhrcclufxpfraxpvdl.supabase.co:5432/postgres"

-- Eliminar todas las tablas existentes
DROP TABLE IF EXISTS productos_etiquetas CASCADE;
DROP TABLE IF EXISTS resenas CASCADE;
DROP TABLE IF EXISTS ordenes CASCADE;
DROP TABLE IF EXISTS banners CASCADE;
DROP TABLE IF EXISTS configuracion CASCADE;
DROP TABLE IF EXISTS etiquetas CASCADE;
DROP TABLE IF EXISTS productos CASCADE;
DROP TABLE IF EXISTS subcategorias CASCADE;
DROP TABLE IF EXISTS categorias CASCADE;

-- Ahora ejecutar todo el contenido de SETUP-DATABASE.sql
