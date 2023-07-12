import {JSONSchema} from 'json-schema-to-ts';
import dedent from 'dedent';
import {listOfFriends} from './config';

const equalSplitSchema = {
  type: 'object',
  description:
    'Split the bill equally between all friends. Useful if one friend payed an expense for the whole group.',
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
} as const satisfies JSONSchema;

const subgroupSplitSchema = {
  type: 'object',
  description:
    'Split the bill equally between a subset of friends. ' +
    'Useful if you need to omit one or more friends from an expense. ' +
    "The list of 'peers' should NOT include the friend who paid for the expense.",
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
      description: dedent`
        The names of the friends who are splitting the bill.
        This should not include the friend who paid.
      `,
      items: {
        type: 'string',
        enum: listOfFriends,
      },
    },
  },
  required: ['costType', 'totalBill', 'paidBy', 'peers'],
} as const satisfies JSONSchema;

const peerSplitSchema = {
  type: 'object',
  description: dedent`
    Split the bill between the user and one other friend.
    Useful if one friend paid for an expense for themselves and one other friend
  `,
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
      description: 'The name of the friend who is splitting the bill.',
    },
  },
  required: ['costType', 'totalBill', 'paidBy', 'peer'],
} as const satisfies JSONSchema;

const outputSchema = {
  type: 'object',
  properties: {
    cost: {
      description: 'Your choice of the type of cost',
      oneOf: [subgroupSplitSchema, equalSplitSchema, peerSplitSchema],
    },
  },
  required: ['cost'],
} as const satisfies JSONSchema;

export const functionSchema = {
  name: 'add_cost',
  description: 'Add a new cost',
  parameters: outputSchema,
} as const;
