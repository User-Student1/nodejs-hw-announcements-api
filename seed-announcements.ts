import bcrypt from 'bcrypt'
import prisma from './prisma/client.ts'
import type { Prisma } from './generated/prisma/client.ts'

// Demo user: created if missing (login: ivan_petrenko / secret123)
const ivan = await prisma.user.upsert({
  where: { username: 'ivan_petrenko' },
  update: {},
  create: {
    username: 'ivan_petrenko',
    email: 'ivan@example.com',
    password: await bcrypt.hash('secret123', 10),
    name: 'Іван',
  },
})

const items: Omit<Prisma.AnnouncementCreateManyInput, 'userId'>[] = [
  { title: 'Продам ноутбук ASUS', description: 'Відмінний стан, 16GB RAM', price: 18000, category: 'sale' },
  { title: 'НОУТБУК Lenovo для навчання', description: 'Легкий, батарея тримає 8 годин', price: 12500, category: 'sale' },
  { title: 'Ремонт пральних машин', description: 'Виїзд по місту, гарантія на роботу', price: 500, category: 'service' },
  { title: 'Шукаю сантехніка на виклик', description: 'Потрібно замінити змішувач на кухні', price: 800, category: 'job' },
  { title: 'Продам велосипед гірський', description: 'Гірський велосипед, 21 швидкість', price: 8000, category: 'sale' },
  { title: 'Уроки англійської мови', description: 'Онлайн заняття для дорослих і дітей', price: 350, category: 'service' },
  { title: 'Вакансія: адміністратор', description: 'Робота на ресепшн, графік 2 через 2', price: 15000, category: 'job' },
  { title: 'Віддам кошеня в добрі руки', description: 'Привчене до лотка, дуже лагідне', price: 1, category: 'other' },
  { title: 'Продам iPhone 13 128GB', description: 'Без подряпин, повний комплект', price: 17000, category: 'sale' },
  { title: 'Майстер на годину', description: 'Дрібний ремонт по дому, збирання меблів', price: 400, category: 'service' },
  { title: 'Шукаю роботу кухарем', description: 'Досвід роботи у ресторані 5 років', price: 20000, category: 'job' },
  { title: 'Обміняю книги на ігри', description: 'Художня література на настільні ігри', price: 100, category: 'other' },
]

// Created one by one so each record gets its own createdAt
for (const item of items) {
  await prisma.announcement.create({ data: { ...item, userId: ivan.id } })
}

console.log('Created announcements:', items.length)
await prisma.$disconnect()