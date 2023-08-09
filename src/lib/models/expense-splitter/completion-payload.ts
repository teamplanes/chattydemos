import dedent from 'dedent';
import {CreateChatCompletionRequest} from 'openai';
import {functionSchema} from './function-schema';
import {Input} from './types';
import {listOfFriends, me} from './config';

export const completionPayload = (
  input: Input,
): CreateChatCompletionRequest => ({
  model: 'gpt-4-0613',
  function_call: {
    name: 'add_cost',
  },
  functions: [functionSchema],
  messages: [
    {
      role: 'system',
      content: dedent`
        You are ChattySplitGPT, an AI bot that decides which debt command to run based on the user's input.

        The user is a human who is trying to split a bill with their friends.

        The list of friends is: ${listOfFriends.join(', ')}.

        You have three cost type options:
         ${functionSchema.parameters.properties.cost.oneOf
           .map((costType) => {
             return `- "${costType.properties.costType.enum[0]}": ${costType.description}`;
           })
           .join('\n')}

        Select the appropriate cost type based on the user's expense.

        For any ambiguous costs from user input, please assume the cost is split equally between all friends.
        `,
    },
    {
      role: 'user',
      content: dedent`
        ${me}'s input is: "${input.expenseAsNaturalLanguage}"
      `,
    },
  ],
  temperature: 0,
});
