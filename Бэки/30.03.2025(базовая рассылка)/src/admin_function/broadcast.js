const ADMIN_IDS = [1089596961]; // ID Telegram администраторов
const userStates = {}; // временное хранилище состояний админов при рассылке

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

    bot.sendMessage(chatId, `Отправьте текст для ${type}:`);
  });

  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const state = userStates[chatId];

    if (!state) return;

    if (state.step === 'awaiting_text' && msg.text && !msg.text.startsWith('/')) {
      state.content.text = msg.text;
      state.step = 'awaiting_media';

      return bot.sendMessage(chatId, 'Пришлите фото или видео, или напишите "/skip", чтобы пропустить.');
    }

    if (state.step === 'awaiting_media') {
      if (msg.photo) {
        state.content.photo = msg.photo[msg.photo.length - 1].file_id;
      } else if (msg.video) {
        state.content.video = msg.video.file_id;
      } else if (msg.text !== '/skip') {
        return bot.sendMessage(chatId, 'Неправильный формат. Пришлите фото, видео или "/skip".');
      }

      // Отправляем рассылку сразу, без подтверждения
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
        } catch (error) {
          console.log(`Ошибка отправки пользователю ${user.tgId}:`, error);
        }
      });

      bot.sendMessage(chatId, '✅ Рассылка успешно отправлена!');
      delete userStates[chatId];
    }
  });

  bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;

    if (!ADMIN_IDS.includes(chatId)) {
      bot.answerCallbackQuery(query.id, { text: '🚫 У вас нет прав администратора.' });
      return;
    }

    let type;

    if (query.data === 'inline_adpost') {
      type = 'рекламного поста';
    } else if (query.data === 'inline_broadcast') {
      type = 'информационной рассылки';
    } else {
      return;
    }

    userStates[chatId] = {
      step: 'awaiting_text',
      content: {},
      type
    };

    bot.sendMessage(chatId, `Отправьте текст для ${type}:`);
    bot.answerCallbackQuery(query.id);
  });
}

module.exports = setupBroadcast;
