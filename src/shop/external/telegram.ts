import TelegramBot from 'node-telegram-bot-api';

const token = process.env.TELEGRAM_BOT_TOKEN || 'no-token-configured';

export const sendMessage = async (chatId: number, text: string) => {
    const bot = new TelegramBot(token, {
        polling: false,
    });

    return bot.sendMessage(chatId, text);
}
