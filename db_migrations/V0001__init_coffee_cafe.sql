
CREATE TABLE menu_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  tag VARCHAR(100) DEFAULT 'Новинка',
  tag_color VARCHAR(100) DEFAULT 'var(--primary)',
  image_url TEXT,
  category VARCHAR(100) DEFAULT 'Кофе',
  available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  customer_name VARCHAR(200) NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  total INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(50) DEFAULT 'new',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE admins (
  id SERIAL PRIMARY KEY,
  login VARCHAR(100) UNIQUE NOT NULL,
  code_hash VARCHAR(200) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO menu_items (name, description, price, tag, tag_color, image_url, category) VALUES
('Эспрессо', 'Крепкий, насыщенный, классический. Обжарка 100% арабики из Эфиопии.', 180, 'Хит', 'var(--primary)', 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=600&q=80', 'Кофе'),
('Капучино', 'Двойной эспрессо, нежная молочная пена и немного корицы по желанию.', 260, 'Популярное', 'var(--secondary)', 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=600&q=80', 'Кофе'),
('Латте с ванилью', 'Мягкий кофе с натуральным ванильным сиропом и бархатным молоком.', 290, 'Новинка', 'var(--accent)', 'https://images.unsplash.com/photo-1561047029-3000c68339ca?auto=format&fit=crop&w=600&q=80', 'Кофе'),
('Круассан с сыром', 'Слоёный круассан с сыром бри и прованскими травами. Выпекаем каждое утро.', 220, 'Завтрак', 'var(--primary)', 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80', 'Еда'),
('Авокадо-тост', 'Хрустящий хлеб на закваске, авокадо, яйцо пашот и микрозелень.', 380, 'Завтрак', 'var(--primary)', 'https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?auto=format&fit=crop&w=600&q=80', 'Еда'),
('Лимонад Ретро', 'Домашний лимонад с имбирём, мятой и газированной водой. Никаких консервантов.', 240, 'Без кофеина', 'var(--accent)', 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?auto=format&fit=crop&w=600&q=80', 'Напитки');

INSERT INTO admins (login, code_hash) VALUES ('admin', 'coffee2024');
