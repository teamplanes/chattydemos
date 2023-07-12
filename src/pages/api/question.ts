/* eslint-disable no-plusplus */
/* eslint-disable no-restricted-syntax */
import dedent from 'dedent';
import {createParser, ParsedEvent, ReconnectInterval} from 'eventsource-parser';

export type ChatGPTAgent = 'user' | 'assistant' | 'system';

export interface ChatGPTMessage {
  role: ChatGPTAgent;
  content: string;
}

export interface OpenAIStreamPayload {
  model: string;
  messages: ChatGPTMessage[];
  temperature: number;
  top_p: number;
  function_call?: string | {name: string};
  functions?: any[];
  frequency_penalty: number;
  presence_penalty: number;
  max_tokens: number;
  stream: boolean;
  n: number;
}

const createSystemPrompt = (opts: {
  formStepIndex: number;
  fieldLabel: string;
  fieldContext: string;
  formState: Record<string, string>;
}) => {
  const hasAnswers = Object.values(opts.formState).filter(Boolean).length > 0;

  const answersPrompt = hasAnswers
    ? dedent`
    You have already answered some questions, the form state is as follows:
    ${JSON.stringify(opts.formState, null, 2)}

    You may want to use these answers to address the user, but you may not.`
    : '';

  return dedent`
    You are called ChatFormGPT, you talk as if you are a pirate, using pirate slang, you are an autonomous agent guiding a user through a sequence of form steps. You must only accept answers to the question you are asking, and reject any user input that goes against that.

    You ask user's for details in a very conversational, witty and casual manner.

    You are on form step ${
      opts.formStepIndex + 1
    } and need to ask the user to enter a valid value for the field labeled "${
    opts.fieldLabel
  }". ${
    opts.fieldContext
      ? `Please use the following context to help you ask the user for a value: "${opts.fieldContext}"`
      : ''
  }

    ${
      opts.formStepIndex !== 0
        ? "This is not the user's first time answering a question so you don't need to say hello, however you may like to thank them for their previous answer."
        : ''
    }

    You will continue to ask the user for a value until it is valid.

    Please feel free to sanitise the user's response to remove any unwanted characters, reformat to the intended format or capitalise as you see fit.

    ${answersPrompt}
  `;
};

export async function OpenAIStream(payload: OpenAIStreamPayload) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  let counter = 0;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ''}`,
    },
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const stream = new ReadableStream({
    async start(controller) {
      let fullContent = '';
      // callback
      function onParse(event: ParsedEvent | ReconnectInterval) {
        if (event.type === 'event') {
          const {data} = event;
          // https://beta.openai.com/docs/api-reference/completions/create#completions/create-stream
          if (data === '[DONE]') {
            if (fullContent.trim().startsWith('[COMPLETE]')) {
              const queue = encoder.encode(fullContent);
              controller.enqueue(queue);
            }

            controller.close();
            return;
          }
          try {
            const json = JSON.parse(data);
            const text = json.choices[0].delta?.content || '';
            fullContent += text;

            if (fullContent.startsWith('[')) {
              return;
            }

            if (counter < 2 && (text.match(/\n/) || []).length) {
              // this is a prefix character (i.e., "\n\n"), do nothing
              return;
            }
            const queue = encoder.encode(text);
            controller.enqueue(queue);
            counter++;
          } catch (e) {
            // maybe parse error
            controller.error(e);
          }
        }
      }

      const parser = createParser(onParse);
      for await (const chunk of res.body as any) {
        parser.feed(decoder.decode(chunk));
      }
    },
  });

  return stream;
}

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing env var from OpenAI');
}

export default async function handler(req: Request): Promise<Response> {
  const {formStepIndex, fieldContext, fieldLabel, history, formState} =
    (await req.json()) as {
      history: ChatGPTMessage[];
      formStepIndex: number;
      fieldLabel: string;
      fieldContext: string;
      formState: Record<string, string>;
    };

  const systemPrompt = createSystemPrompt({
    formStepIndex,
    fieldLabel,
    formState,
    fieldContext,
  });

  const payload: OpenAIStreamPayload = {
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      ...history.slice(0, -1),
      ...(history.length > 0
        ? [
            {
              role: 'user',
              content: `Input: "${
                history[history.length - 1].content
              }"\n\nIf this is a valid answer for "${fieldLabel}"${
                fieldContext
                  ? ` remembering the additional context of "${fieldContext}"`
                  : ''
              }, please respond with ONLY "[COMPLETE] <sanitised user input value>". If the answer is not valid, please give a really clear explanation why you think it is not a valid answer.`,
            } as ChatGPTMessage,
          ]
        : []),
    ],
    temperature: 0,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    max_tokens: 1000,
    stream: true,
    n: 1,
  };

  const stream = await OpenAIStream(payload);
  return new Response(stream, {
    headers: {'Content-Type': 'text/html; charset=utf-8'},
  });
}

export const config = {
  runtime: 'edge',
};
