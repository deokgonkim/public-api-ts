/**
 * telegram scheme JSDoc definition
 */


/**
 * @typedef {Object} TelegramUpdate
 * @property {number} update_id - The update's unique identifier.
 * @property {TelegramMessage} message - The message object.
 */
export interface TelegramUpdate {
    update_id: number;
    message: TelegramMessage;
}

/**
 * @typedef {Object} TelegramMessage
 * @property {number} message_id - The message's unique identifier.
 * @property {TelegramUser} from - The sender of the message.
 * @property {TelegramChat} chat - The chat to which the message belongs.
 * @property {number} date - The date the message was sent in Unix time.
 * @property {string} text - The text of the message.
 * @property {Array.<TelegramEntity>} entities - Special entities like usernames, URLs, bot commands, etc. that appear in the text.
 */
export interface TelegramMessage {
    message_id: number;
    from: TelegramUser;
    chat: TelegramChat;
    date: number;
    text: string;
    entities: TelegramEntity[];
}

/**
 * @typedef {Object} TelegramUser
 * @property {number} id - The user's unique identifier.
 * @property {boolean} is_bot - True if the user is a bot.
 * @property {string} first_name - The user's first name.
 * @property {string} last_name - The user's last name.
 * @property {string} username - The user's username.
 * @property {string} language_code - The IETF language tag of the user's language.
 */
export interface TelegramUser {
    id: number;
    is_bot: boolean;
    first_name: string;
    last_name: string;
    username: string;
    language_code: string;
}

/**
 * @typedef {Object} TelegramChat
 * @property {number} id - The chat's unique identifier.
 * @property {string} first_name - The chat's first name.
 * @property {string} last_name - The chat's last name.
 * @property {string} username - The chat's username.
 * @property {string} type - The type of chat, can be either "private", "group", "supergroup" or "channel".
 */
export interface TelegramChat {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
    type: string;
}

/**
 * @typedef {Object} TelegramEntity
 * @property {number} offset - The offset in UTF-16 code units to the start of the entity.
 * @property {number} length - The length of the entity in UTF-16 code units.
 * @property {string} type - The type of entity. E.g., "bot_command".
 */
export interface TelegramEntity {
    offset: number;
    length: number;
    type: string;
}
