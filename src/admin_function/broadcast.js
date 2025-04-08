const ADMIN_IDS = [1089596961,481845397,481845397];
const userStates = {};
const kb = require('../keyboard_buttons');
const kb_text = require('../keyboard_text');

function setupBroadcast(bot, User) {
  bot.onText(/\/(broadcast|adpost)/, async (msg) => {
    const chatId = msg.chat.id;

    if (!ADMIN_IDS.includes(chatId)) {
      return bot.sendMessage(chatId, 'У вас нет прав администратора.');
    }

    const type = msg.text === '/broadcast' ? 'информационной рассылки' : 'рекламного поста';

    userStates[chatId] = {
      step: 'awaiting_text',
      content: {},
      type
    };

    bot.sendMessage(chatId, `Отправьте текст для ${type}:`, {
      reply_markup: {
        keyboard: [['Назад']],
        resize_keyboard: true
      }
    });
  });

  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const state = userStates[chatId];
    if (!state) return;

    // Обработка кнопки Назад
    if (msg.text === 'Назад') {
      delete userStates[chatId];
      bot.sendMessage(chatId, 'Вы вернулись в главное меню.', {
        reply_markup: {
          keyboard: kb_text.home[0],
          resize_keyboard: true
        }
      });
      return;
    }

    if (state.step === 'awaiting_text' && !state.content.text && msg.text === kb.home.broadcast) {
      return; // игнорируем текст кнопки при первом нажатии
    }

    if (state.step === 'awaiting_text' && msg.text && !msg.text.startsWith('/')) {
      state.content.text = msg.text;
      state.step = 'awaiting_media';

      return bot.sendMessage(chatId, 'Пришлите фото или видео, или напишите "/skip", чтобы пропустить.', {
        reply_markup: {
          keyboard: [['Назад']],
          resize_keyboard: true
        }
      });
    }

    if (state.step === 'awaiting_media') {
      if (msg.photo) {
        state.content.photo = msg.photo[msg.photo.length - 1].file_id;
      } else if (msg.video) {
        state.content.video = msg.video.file_id;
      } else if (msg.text !== '/skip') {
        return bot.sendMessage(chatId, 'Неправильный формат. Пришлите фото, видео или "/skip".', {
          reply_markup: {
            keyboard: [['Назад']],
            resize_keyboard: true
          }
        });
      }

      state.step = 'awaiting_button_decision';
      return bot.sendMessage(chatId, 'Установить кнопку?', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '✅ Да', callback_data: 'button_yes' }],
            [{ text: '❌ Нет', callback_data: 'button_no' }]
          ]
        }
      });
    }

    if (state.step === 'awaiting_button_text' && msg.text) {
      state.content.button_text = msg.text;
      state.step = 'awaiting_button_url';

      return bot.sendMessage(chatId, 'Отправьте ссылку для кнопки:', {
        reply_markup: {
          keyboard: [['Назад']],
          resize_keyboard: true
        }
      });
    }

    if (state.step === 'awaiting_button_url' && msg.text) {
      state.content.button_url = msg.text;
      const users = await User.find({});

      users.forEach(async (user) => {
        const opts = {
          reply_markup: {
            inline_keyboard: [[{ text: state.content.button_text, url: state.content.button_url }]]
          }
        };
        try {
          if (state.content.photo) {
            await bot.sendPhoto(user.tgId, state.content.photo, { caption: state.content.text, ...opts });
          } else if (state.content.video) {
            await bot.sendVideo(user.tgId, state.content.video, { caption: state.content.text, ...opts });
          } else {
            await bot.sendMessage(user.tgId, state.content.text, opts);
          }
        } catch (e) {
          console.log('Ошибка отправки:', e);
        }
      });

      bot.sendMessage(chatId, '✅ Рассылка с кнопкой успешно отправлена!');
      delete userStates[chatId];
    }
  });

  bot.on('callback_query', async (query) => {
    const data = query.data;
    if (data !== 'button_yes' && data !== 'button_no') return;

    const chatId = query.message.chat.id;
    const state = userStates[chatId];

    if (!ADMIN_IDS.includes(chatId)) {
      return bot.answerCallbackQuery(query.id, { text: '🚫 У вас нет прав администратора.' });
    }

    if (data === 'button_yes') {
      state.step = 'awaiting_button_text';
      bot.sendMessage(chatId, 'Отправьте текст для кнопки:', {
        reply_markup: {
          keyboard: [['Назад']],
          resize_keyboard: true
        }
      });
    } else if (data === 'button_no') {
      const users = await User.find({});

      users.forEach(async (user) => {
        try {
          if (state.content.photo) {
            await bot.sendPhoto(user.tgId, state.content.photo, { caption: state.content.text });
          } else if (state.content.video) {
            await bot.sendVideo(user.tgId, state.content.video, { caption: state.content.text });
          } else {
            await bot.sendMessage(user.tgId, state.content.text);
          }
        } catch (e) {
          console.log('Ошибка отправки:', e);
        }
      });

      bot.sendMessage(chatId, '✅ Рассылка успешно отправлена без кнопки!');
      delete userStates[chatId];
    }

    bot.answerCallbackQuery(query.id);
  });
}

module.exports = {
  setupBroadcast,
  userStates
};