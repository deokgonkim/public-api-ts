import OpenAI from 'openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'sk-blabla';

const model = 'gpt-4o';
const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
});

export const complete = async (content: string) => {
    const stream = await openai.chat.completions.create({
        model,
        messages: [
            {
                role: 'system',
                content: 'You are a helpful assistant.'
            },
            {
                role: 'user',
                content
            }
        ],
        stream: true,
    });
    return stream;
}
