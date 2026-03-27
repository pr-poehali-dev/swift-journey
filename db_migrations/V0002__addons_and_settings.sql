
CREATE TABLE addons (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE cafe_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT NULL;

INSERT INTO addons (name, price) VALUES
('Молоко oat +100мл', 60),
('Сироп ваниль', 50),
('Сироп карамель', 50),
('Сироп лесной орех', 50),
('Двойной эспрессо', 80),
('Взбитые сливки', 70);

INSERT INTO cafe_settings (key, value) VALUES
('address', 'ул. Кофейная, 1'),
('phone', '+7 (999) 000-00-00'),
('email', 'hello@coffee.cafe'),
('hours_weekdays', '08:00–22:00'),
('hours_weekends', '09:00–23:00'),
('description', 'Твоё кофе-место в стиле ретро. Свежеобжаренный кофе, завтраки весь день и атмосфера как в 70-х.'),
('instagram', '@coffee.cafe');
