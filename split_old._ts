import {NextApiHandler} from 'next';
import dedent from 'dedent';
import {listOfFriends, me} from '@/lib/config';
import {OpenAIStreamPayload} from './question';

const parseOutput = (input: string) => {
  try {
    return JSON.parse(input);
  } catch (error) {
    const match = /^(([ \t]*`{3,4})([^\n]*)([\s\S]+?)(^[ \t]*\2))/gm.exec(
      input,
    );

    if (match) {
      const [, , , , code] = match;
      return JSON.parse(code);
    }
    throw new Error('Invalid JSON');
  }
};

const handler: NextApiHandler = async (req, res) => {
  const cost = req.query.cost as string;
  if (!cost) {
    res.status(400).json({error: 'Missing cost'});
    return;
  }
  const payload: OpenAIStreamPayload = {
    model: 'gpt-3.5-turbo-0613',
    function_call: {
      name: 'add_cost',
    },
    functions: [
      {
        name: 'add_cost',
        description: 'Add a new cost',
        parameters: {
          type: 'object',
          properties: {
            cost: {
              oneOf: [
                {
                  type: 'object',
                  description: 'Split the bill equally between all friends.',
                  properties: {
                    costType: {
                      type: 'string',
                      enum: ['equal_split'],
                    },
                    totalBill: {
                      type: 'number',
                      minimum: 0,
                      description: 'The total amount of the bill.',
                    },
                    paidBy: {
                      type: 'string',
                      description: 'The name of the friend who paid the bill.',
                      enum: listOfFriends,
                    },
                  },
                  required: ['costType', 'totalBill', 'paidBy'],
                },
                {
                  type: 'object',
                  description:
                    'Split the bill equally between a subset of friends.',
                  properties: {
                    costType: {
                      type: 'string',
                      enum: ['subgroup_split'],
                    },
                    totalBill: {
                      type: 'number',
                      minimum: 0,
                      description: 'The total amount of the bill.',
                    },
                    paidBy: {
                      type: 'string',
                      description: 'The name of the friend who paid the bill.',
                      enum: listOfFriends,
                    },
                    peers: {
                      type: 'array',
                      description:
                        'The names of the friends who are splitting the bill.',
                      items: {
                        type: 'string',
                        enum: listOfFriends,
                      },
                    },
                  },
                  required: ['costType', 'totalBill', 'paidBy', 'peers'],
                },
                {
                  type: 'object',
                  description:
                    'Split the bill between the user and one other friend.',
                  properties: {
                    costType: {
                      type: 'string',
                      enum: ['peer_split'],
                    },
                    totalBill: {
                      type: 'number',
                      minimum: 0,
                      description: 'The total amount of the bill.',
                    },
                    paidBy: {
                      type: 'string',
                      description: 'The name of the friend who paid the bill.',
                      enum: listOfFriends,
                    },
                    peer: {
                      type: 'string',
                      enum: listOfFriends,
                      description:
                        'The name of the friend who is splitting the bill.',
                    },
                  },
                  required: ['costType', 'totalBill', 'paidBy', 'peer'],
                },
              ],
            },
          },
        },
      },
    ],
    messages: [
      {
        role: 'system',
        content: dedent`
          You are ChattySplitGPT, an AI bot that decides which debt command to run based on the user's input.

          The user is a human who is trying to split a bill with their friends.

          The list of friends is: ${listOfFriends.join(', ')}.

          `,
      },
      {
        role: 'user',
        content: dedent`
          For any ambiguous costs from user input, please assume the cost is split equally between all friends.
          ${me}'s input is: "${cost}"
        `,
      },
    ],
    temperature: 0,
    // top_p: 1,
    // frequency_penalty: 0,
    // presence_penalty: 0,
    // max_tokens: 1000,
    stream: false,
    // n: 1,
  };

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ''}`,
    },
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    console.log(
      '🚀 ~ file: split.ts:155 ~ consthandler:NextApiHandler= ~ text:',
      text,
    );
    res.status(400).json({error: 'An error occurred'});
    return;
  }

  const {choices} = (await response.json()) as {
    choices: {message: {content: string}}[];
  };

  // const parsed = parseOutput(choices[0].message.content);

  // if (parsed.command === 'error') {
  //   res.status(400).json({error: parsed.payload || 'An error occured'});
  //   return;
  // }

  // if (
  //   parsed.command !== 'equalSplit' &&
  //   parsed.command !== 'peerSplit' &&
  //   parsed.command !== 'subgroupSplit'
  // ) {
  //   res.status(400).json({error: `Invalid command ${parsed.command}`});
  //   return;
  // }

  console.log(
    '🚀 ~ file: split.ts:174 ~ consthandler:NextApiHandler= ~ choices:',
    choices,
  );
  res.status(200).json(choices);
};

export default handler;
