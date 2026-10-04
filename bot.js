// ============================================================
// ManifestTools Telegram Bot
// Rocket Way // 20.05.2026
// Channel: -4334184638
// ============================================================

const { Telegraf, Markup } = require('telegraf');
const fetch = require('node-fetch');
const http = require('http');

const BOT_TOKEN   = process.env.BOT_TOKEN   || '8885490824:AAEN2oSrKhe2uXVQtxMm7MWQUoByZc833Uo';
const ADMIN_ID    = parseInt(process.env.ADMIN_ID || '8640716370');
const API_URL     = process.env.API_URL     || 'https://manifest-keys-1.onrender.com';
const BOT_SECRET  = process.env.BOT_SECRET  || 'Manifest_tools_key_1120';
const CARD_NUMBER = process.env.CARD_NUMBER || '2203 8302 7007 4520';
const CHANNEL     = process.env.CHANNEL     || '-4334184638';
const PORT        = process.env.PORT        || 3000;

const PRICES = {
  '1 день':  50,
  '3 дня':   100,
  '7 дней':  170,
  '14 дней': 280,
  '30 дней': 500
};

const bot = new Telegraf(BOT_TOKEN);
const userState = {};

// ============================================================
// API
// ============================================================
async function apiPost(path, body) {
  const r = await fetch(API_URL + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: BOT_SECRET, ...body })
  });
  return r.json();
}

async function apiGet(path) {
  const r = await fetch(API_URL + path + (path.includes('?') ? '&' : '?') + 'secret=' + BOT_SECRET);
  return r.json();
}

// ============================================================
// ПРОВЕРКА ПОДПИСКИ
// ============================================================
async function checkSubscription(ctx) {
  try {
    const member = await ctx.telegram.getChatMember(CHANNEL, ctx.from.id);
    const s = member.status;
    return (s === 'member' || s === 'administrator' || s === 'creator');
  } catch (e) {
    console.log('[checkSub] error:', e.message);
    return false;
  }
}

function subKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.url('📢 Подписаться на канал', 'https://t.me/+RuUi5d5vJghhODJh')],
    [Markup.button.callback('✅ Я подписался', 'check_sub')]
  ]);
}

// ============================================================
// MIDDLEWARE
// ============================================================
bot.use(async (ctx, next) => {
  if (ctx.from && ctx.from.id === ADMIN_ID) return next();
  if (ctx.callbackQuery && ctx.callbackQuery.data === 'check_sub') return next();

  const msg = ctx.message?.text || '';
  if (msg.startsWith('/start')) return next();

  const isSubbed = await checkSubscription(ctx);
  if (!isSubbed) {
    return ctx.reply(
      `📢 *Подпишись на канал*\n\n` +
      `Чтобы пользоваться ботом — подпишись и нажми «✅ Я подписался».`,
      { parse_mode: 'Markdown', ...subKeyboard() }
    );
  }

  return next();
});

// ============================================================
// МЕНЮ
// ============================================================
function mainMenu() {
  return Markup.keyboard([
    ['🛒 Купить ключ', '🔑 Мои ключи'],
    ['📝 Отзывы', '👤 Профиль'],
    ['❓ Помощь']
  ]).resize();
}

// ============================================================
// /start
// ============================================================
bot.start(async (ctx) => {
  const name = ctx.from.first_name || 'друг';

  if (ctx.from.id !== ADMIN_ID) {
    const isSubbed = await checkSubscription(ctx);
    if (!isSubbed) {
      return ctx.reply(
        `👋 Привет, ${name}!\n\n` +
        `📢 *Подпишись на канал*, чтобы пользоваться ботом.\n\n` +
        `После подписки нажми «✅ Я подписался».`,
        { parse_mode: 'Markdown', ...subKeyboard() }
      );
    }
  }

  await ctx.reply(
    `👋 Привет, ${name}!\n\n` +
    `Это магазин ключей *ManifestTools*.\n\n` +
    `🎯 Что можно купить:\n` +
    `• Читы для PUBG Mobile KR / VNG / GL / TW\n` +
    `• Активация на 1 устройство\n` +
    `• Мгновенная выдача ключа\n\n` +
    `Выбери действие 👇`,
    { parse_mode: 'Markdown', ...mainMenu() }
  );
});

// ============================================================
// "Я ПОДПИСАЛСЯ"
// ============================================================
bot.action('check_sub', async (ctx) => {
  const isSubbed = await checkSubscription(ctx);
  if (isSubbed) {
    await ctx.answerCbQuery('✅ Спасибо за подписку!');
    try { await ctx.deleteMessage(); } catch (e) {}
    await ctx.reply(
      `✅ *Спасибо!* Теперь можешь пользоваться ботом.`,
      { parse_mode: 'Markdown', ...mainMenu() }
    );
  } else {
    await ctx.answerCbQuery('❌ Ты ещё не подписан!', { show_alert: true });
  }
});

// ============================================================
// ПОМОЩЬ
// ============================================================
bot.hears('❓ Помощь', async (ctx) => {
  await ctx.reply(
    `❓ *Помощь*\n\n` +
    `🛒 /buy — купить ключ\n` +
    `🔑 /mykeys — мои ключи\n` +
    `📝 /review — оставить отзыв\n` +
    `📖 /reviews — читать отзывы\n` +
    `👤 /profile — профиль\n\n` +
    `💬 Связь: @rocket_admin`,
    { parse_mode: 'Markdown' }
  );
});

// ============================================================
// ПРОФИЛЬ
// ============================================================
bot.hears('👤 Профиль', showProfile);
bot.command('profile', showProfile);

async function showProfile(ctx) {
  await ctx.reply(
    `👤 *Твой профиль*\n\n` +
    `🆔 ID: \`${ctx.from.id}\`\n` +
    `📛 @${ctx.from.username || 'нет'}\n\n` +
    `🔑 Посмотреть ключи: /mykeys`,
    { parse_mode: 'Markdown' }
  );
}

// ============================================================
// МОИ КЛЮЧИ
// ============================================================
bot.hears('🔑 Мои ключи', showMyKeys);
bot.command('mykeys', showMyKeys);

async function showMyKeys(ctx) {
  const r = await apiGet('/api/bot/mykeys?tgId=' + ctx.from.id);

  if (!r.ok) return ctx.reply('❌ Ошибка сервера');

  if (!r.keys || r.keys.length === 0) {
    return ctx.reply(
      `🔑 *Мои ключи*\n\n` +
      `У тебя пока нет купленных ключей.\n\n` +
      `Купить: /buy`,
      { parse_mode: 'Markdown' }
    );
  }

  let text = `🔑 *Мои ключи (${r.keys.length}):*\n\n`;

  r.keys.forEach((k, i) => {
    const date = new Date(+k.paid_at).toLocaleDateString('ru-RU');
    let status = '🟢 Активен';

    if (k.used === 1) {
      if (k.expires && Date.now() > +k.expires) {
        status = '🔴 Истёк';
      } else if (k.expires) {
        const daysLeft = Math.ceil((+k.expires - Date.now()) / 86400000);
        status = `🟡 Использован (осталось ${daysLeft} дн.)`;
      } else {
        status = '🟡 Использован';
      }
    }

    text += `*${i + 1}.* \`${k.key_value}\`\n`;
    text += `   📦 ${k.duration} • 💰 ${k.price} ₽\n`;
    text += `   ${status}\n`;
    text += `   📅 ${date}\n\n`;
  });

  text += `_Нажми на ключ — скопируется_`;

  await ctx.reply(text, { parse_mode: 'Markdown' });
}

// ============================================================
// КУПИТЬ
// ============================================================
bot.hears('🛒 Купить ключ', buyMenu);
bot.command('buy', buyMenu);

async function buyMenu(ctx) {
  const buttons = Object.entries(PRICES).map(([d, p]) => [
    Markup.button.callback(`${d} — ${p} ₽`, `buy_${d}`)
  ]);
  buttons.push([Markup.button.callback('❌ Отмена', 'cancel')]);

  await ctx.reply(
    `🛒 *Выбери тариф:*\n\n` +
    Object.entries(PRICES).map(([d, p]) => `• ${d} — *${p} ₽*`).join('\n'),
    { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) }
  );
}

// ============================================================
// ВЫБОР ТАРИФА
// ============================================================
bot.action(/^buy_(.+)$/, async (ctx) => {
  const duration = ctx.match[1];
  const price = PRICES[duration];
  if (!price) return ctx.answerCbQuery('Ошибка');

  const orderRes = await apiPost('/api/bot/order', {
    tgId: ctx.from.id,
    tgUsername: ctx.from.username || '',
    duration: duration
  });

  if (!orderRes.ok) return ctx.answerCbQuery('Ошибка сервера');

  await ctx.editMessageText(
    `🛒 *Заказ создан*\n\n` +
    `📦 Тариф: *${duration}*\n` +
    `💰 Сумма: *${price} ₽*\n` +
    `🆔 Заказ №\`${orderRes.orderId}\`\n\n` +
    `💳 *Реквизиты:*\n` +
    `\`${CARD_NUMBER}\`\n\n` +
    `✅ После оплаты нажми кнопку ниже.`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('✅ Я оплатил', `paid_${orderRes.orderId}`)],
        [Markup.button.callback('❌ Отмена', 'cancel')]
      ])
    }
  );

  try {
    await bot.telegram.sendMessage(ADMIN_ID,
      `🔔 *Новый заказ!*\n\n` +
      `🆔 №\`${orderRes.orderId}\`\n` +
      `📦 ${duration}\n` +
      `💰 ${price} ₽\n` +
      `👤 @${ctx.from.username || 'без username'} (\`${ctx.from.id}\`)`,
      { parse_mode: 'Markdown' }
    );
  } catch (e) {}
});

// ============================================================
// "Я ОПЛАТИЛ"
// ============================================================
bot.action(/^paid_(\d+)$/, async (ctx) => {
  const orderId = ctx.match[1];

  await ctx.editMessageText(
    `⏳ *Заявка отправлена.*\n\n` +
    `Заказ №\`${orderId}\`\n` +
    `Ожидайте 5-30 минут.`,
    { parse_mode: 'Markdown' }
  );

  await bot.telegram.sendMessage(ADMIN_ID,
    `💸 *Юзер оплатил!*\n\n` +
    `🆔 №\`${orderId}\`\n` +
    `👤 @${ctx.from.username || 'без username'} (\`${ctx.from.id}\`)\n\n` +
    `Подтверди:`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('✅ Подтвердить', `approve_${orderId}`)],
        [Markup.button.callback('❌ Отклонить', `reject_${orderId}`)]
      ])
    }
  );
});

// ============================================================
// АДМИН: ПОДТВЕРДИТЬ
// ============================================================
bot.action(/^approve_(\d+)$/, async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return ctx.answerCbQuery('Нет доступа');

  const orderId = ctx.match[1];
  const orders = await apiGet('/api/bot/orders');
  const order = (orders.orders || []).find(o => o.id == orderId);
  if (!order) return ctx.answerCbQuery('Заказ не найден');

  if (order.status === 'paid') return ctx.answerCbQuery('Уже выдан');

  const gen = await apiPost('/api/bot/generate', {
    tgId: order.tg_id,
    tgUsername: order.tg_username,
    duration: order.duration
  });

  if (!gen.ok) return ctx.answerCbQuery('Ошибка');

  try {
    await bot.telegram.sendMessage(order.tg_id,
      `✅ *Оплата подтверждена!*\n\n` +
      `🎁 *Твой ключ:*\n` +
      `\`${gen.key}\`\n\n` +
      `📦 Тариф: *${order.duration}*\n` +
      `💰 ${order.price} ₽\n\n` +
      `🔑 Введи при запуске чита.\n\n` +
      `🔑 Все ключи: /mykeys\n` +
      `📝 Оставь отзыв: /review`,
      { parse_mode: 'Markdown' }
    );
  } catch (e) {
    return ctx.answerCbQuery('Не отправить ключ');
  }

  await ctx.editMessageText(
    `✅ Заказ №${orderId} выдан.\n🔑 \`${gen.key}\``,
    { parse_mode: 'Markdown' }
  );
});

// ============================================================
// АДМИН: ОТКЛОНИТЬ
// ============================================================
bot.action(/^reject_(\d+)$/, async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return ctx.answerCbQuery('Нет доступа');
  const orderId = ctx.match[1];

  await ctx.editMessageText(`❌ Заказ №${orderId} отклонён.`);

  const orders = await apiGet('/api/bot/orders');
  const order = (orders.orders || []).find(o => o.id == orderId);
  if (order) {
    try {
      await bot.telegram.sendMessage(order.tg_id, `❌ Заказ №${orderId} отклонён.`);
    } catch (e) {}
  }
});

// ============================================================
// ОТМЕНА
// ============================================================
bot.action('cancel', async (ctx) => {
  await ctx.editMessageText('❌ Отменено.');
});

// ============================================================
// ОТЗЫВ
// ============================================================
bot.command('review', async (ctx) => {
  userState[ctx.from.id] = { action: 'review' };
  await ctx.reply('📝 Напиши отзыв одним сообщением:');
});

// ============================================================
// ОТЗЫВЫ
// ============================================================
bot.hears('📝 Отзывы', showReviews);
bot.command('reviews', showReviews);

async function showReviews(ctx) {
  const r = await apiGet('/api/bot/reviews');
  if (!r.ok || !r.reviews || r.reviews.length === 0) {
    return ctx.reply('📭 Пока нет отзывов.');
  }

  let text = `📝 *Отзывы:*\n\n`;
  r.reviews.slice(0, 10).forEach(rev => {
    text += `⭐ ${rev.rating}/5 — @${rev.tg_username || 'аноним'}\n«${rev.text}»\n\n`;
  });

  await ctx.reply(text, { parse_mode: 'Markdown' });
}

// ============================================================
// ОБРАБОТКА ТЕКСТА
// ============================================================
bot.on('text', async (ctx) => {
  const state = userState[ctx.from.id];
  if (state && state.action === 'review') {
    const text = ctx.message.text;
    if (text.length < 3) return ctx.reply('❌ Слишком коротко');

    const r = await apiPost('/api/bot/review', {
      tgId: ctx.from.id,
      tgUsername: ctx.from.username || '',
      text: text,
      rating: 5
    });

    if (r.ok) {
      delete userState[ctx.from.id];
      await ctx.reply('✅ Спасибо за отзыв!');
      try {
        await bot.telegram.sendMessage(ADMIN_ID,
          `📝 *Новый отзыв!*\n\n👤 @${ctx.from.username || 'аноним'}\n«${text}»`,
          { parse_mode: 'Markdown' }
        );
      } catch (e) {}
    } else {
      await ctx.reply('❌ Ошибка');
    }
    return;
  }

  await ctx.reply('Выбери действие 👇', mainMenu());
});

// ============================================================
// АДМИН: /stats /orders
// ============================================================
bot.command('stats', async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;
  const s = await apiGet('/api/bot/stats');
  if (!s.ok) return ctx.reply('Ошибка');
  await ctx.reply(
    `📊 *Статистика*\n\n✅ ${s.total}\n⏳ ${s.pending}\n💰 ${s.revenue} ₽\n🔑 ${s.botKeys}`,
    { parse_mode: 'Markdown' }
  );
});

bot.command('orders', async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;
  const r = await apiGet('/api/bot/orders');
  if (!r.ok || !r.orders.length) return ctx.reply('📭 Нет заказов');
  let text = `📋 *Заказы:*\n\n`;
  r.orders.slice(0, 10).forEach(o => {
    const s = o.status === 'paid' ? '✅' : '⏳';
    text += `${s} №${o.id} — ${o.duration} — ${o.price}₽\n@${o.tg_username || o.tg_id}\n\n`;
  });
  await ctx.reply(text, { parse_mode: 'Markdown' });
});

// ============================================================
// ЗАПУСК БОТА
// ============================================================
bot.launch().then(() => {
  console.log('[ManifestBot] Запущен');
  console.log('[ManifestBot] Admin ID:', ADMIN_ID);
  console.log('[ManifestBot] Channel:', CHANNEL);
});

// ============================================================
// HTTP СЕРВЕР (для Render — требует открытый порт)
// ============================================================
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('ManifestTools Bot OK');
}).listen(PORT, () => {
  console.log('[ManifestBot] HTTP server on port ' + PORT);
});

process.once('SIGINT',  () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
