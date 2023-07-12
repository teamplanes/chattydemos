/* eslint-disable import/no-extraneous-dependencies */
import {describe, expect, it} from 'vitest';
import {Output, financeAssistant} from '.';

describe('finance-assistant', () => {
  it.each([
    {
      question: 'how much did I spend last month?',
      expected:
        "SELECT SUM(amount) AS total_spent FROM ? WHERE date >= '2023-06-01' AND date < '2023-07-01'" satisfies Output,
    },
    {
      question: 'show me all transactions ive spent on coffee',
      expected: "SELECT * FROM ? WHERE category = 'Coffee'" satisfies Output,
    },
  ])('test input $question', async ({question, expected}) => {
    const result = await financeAssistant({question});
    expect(result).toStrictEqual(expected);
  });
});
