/* eslint-disable import/no-extraneous-dependencies */
import {describe, expect, it} from 'vitest';
import {Output, sentimentAnalyser} from '.';

describe('sentiment-analyser', () => {
  it.each([
    {
      statement: 'i feel a bit down today',
      expected: 'negative' satisfies Output,
    },
    {
      statement: 'baked beans taste like heaven',
      expected: 'positive' satisfies Output,
    },
    {
      statement: 'what is the weather today?',
      expected: 'neutral' satisfies Output,
    },
  ])('test input $statement', async ({statement, expected}) => {
    const result = await sentimentAnalyser({statement});
    expect(result).toStrictEqual(expected);
  });
});
