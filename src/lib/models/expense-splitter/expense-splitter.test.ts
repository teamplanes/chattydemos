/* eslint-disable import/no-extraneous-dependencies */
import {describe, expect, it} from 'vitest';
import {expenseSplitter} from '.';
import {Output} from './types';

describe('expense-splitter', () => {
  it.each([
    {
      expenseAsNaturalLanguage: 'henry paid for the groups dinner, it was £10',
      expected: {
        costType: 'equal_split',
        paidBy: 'Henry',
        totalBill: 10,
      } satisfies Output,
    },
    {
      expenseAsNaturalLanguage:
        'Dom and I went for dinner together, I paid for it. The bill was £89.96',
      expected: {
        costType: 'peer_split',
        paidBy: 'Henry',
        peer: 'Dom',
        totalBill: 89.96,
      } satisfies Output,
    },
    {
      expenseAsNaturalLanguage:
        'me, dom and Alex plaid snooker for a tenner, i paid',
      expected: {
        costType: 'subgroup_split',
        paidBy: 'Henry',
        peers: ['Dom', 'Alex'].sort(),
        totalBill: 10,
      } satisfies Output,
    },
    {
      expenseAsNaturalLanguage:
        "We played a game of bowling, it was £10 for the lane, Dom paid for it but Alex didn't bowl.",
      expected: {
        costType: 'subgroup_split',
        paidBy: 'Dom',
        peers: ['Henry', 'Dee', 'Kamaal'].sort(),
        totalBill: 10,
      } satisfies Output,
    },
  ])(
    'test input $expenseAsNaturalLanguage',
    async ({expenseAsNaturalLanguage, expected}) => {
      const result = await expenseSplitter({expenseAsNaturalLanguage});

      if (result.costType === 'subgroup_split') {
        result.peers.sort();
      }

      expect(result).toStrictEqual(expected);
    },
  );
});
