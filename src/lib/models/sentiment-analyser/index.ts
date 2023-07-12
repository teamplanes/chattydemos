import {FromSchema} from 'json-schema-to-ts';
import {functionSchema} from './function-schema';

export interface Input {
  statement: string;
}

export type Output = FromSchema<
  (typeof functionSchema)['parameters']
>['sentiment'];

export const sentimentAnalyser = async (input: Input): Promise<Output> => {
  const payload = {
    model: 'gpt-3.5-turbo-0613',
    function_call: {
      name: 'output_sentiment',
    },
    functions: [functionSchema],
    messages: [
      {
        role: 'system',
        content: `You are ChattySentimentGPT, an AI bot that decides which sentiment command to run based on the user's input.

            The user is a human who is trying to analyse the sentiment of a statement.

            You have three sentiment options:
            ${functionSchema.parameters.properties.sentiment.enum.map(
              (sentiment) => {
                return `- "${sentiment}": The sentiment of the input text is ${sentiment}.`;
              },
            )}

            Select the appropriate sentiment based on the user's statement.
            `,
      },
      {
        role: 'user',
        content: `The user's statement is: "${input.statement}"`,
      },
    ],
    temperature: 0,
  };

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text);
  }

  const result = await response.json();

  const {sentiment} = JSON.parse(
    result.choices[0].message.function_call.arguments,
  );

  return sentiment as Output;
};
