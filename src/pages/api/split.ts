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
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'user',
        content: dedent`
          You are ChattySplitGPT, an AI bot that decides which debt command to run based on the user's input.

          The user is a human who is trying to split a bill with their friends.

          You have the following three possible commands:
          - "equalSplit": Split the bill equally between all friends. Inputs: "totalBill", "paidBy"
          - "subgroupSplit": Split the bill equally between a subset of friends. Inputs: "totalBill", "paidBy", "peers"
          - "peerSplit": Split the bill between the user and one other friend. Inputs: "totalBill", "paidBy", "peer"

          Please return the name of the command you would like to run along with it's payload in the following format:
          \`\`\`json
          {
            "command": "equalSplit",
            "payload": {
              "totalBill": Number,
              "paidBy": String
            }
          }
          \`\`\`

          OR

          \`\`\`json
          {
            "command": "subgroupSplit",
            "payload": {
              "totalBill": Number,
              "paidBy": String,
              "peers": [String]
            }
          }
          \`\`\`

          OR

          \`\`\`json
          {
            "command": "peerSplit",
            "payload": {
              "totalBill": Number,
              "paidBy": String,
              "peer": String
            }
          }
          \`\`\`

          The list of possible friends is ${listOfFriends}.

          If the user's input references a friend that is not in the list, please return the following JSON:
          \`\`\`json
          {
            "command": "error",
            "payload": "Invalid friend name"
          }
          \`\`\`

          ${me}'s input is: "${cost}"
          ${me} may have provided a name in lowercase, so please sanitize the input.
          Please only return your JSON response, no other text.
        `,
      },
    ],
    temperature: 0,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    max_tokens: 1000,
    stream: false,
    n: 1,
  };

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ''}`,
    },
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const {choices} = (await response.json()) as {
    choices: {message: {content: string}}[];
  };

  const parsed = parseOutput(choices[0].message.content);

  if (parsed.command === 'error') {
    res.status(400).json({error: parsed.payload || 'An error occured'});
    return;
  }

  if (
    parsed.command !== 'equalSplit' &&
    parsed.command !== 'peerSplit' &&
    parsed.command !== 'subgroupSplit'
  ) {
    res.status(400).json({error: `Invalid command ${parsed.command}`});
    return;
  }

  res.status(200).json(parsed);
};

export default handler;
