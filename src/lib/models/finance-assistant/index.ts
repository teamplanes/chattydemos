import {FromSchema} from 'json-schema-to-ts';
import dedent from 'dedent';
import {functionSchema} from './function-schema';

export interface Input {
  question: string;
}

export type Output = FromSchema<(typeof functionSchema)['parameters']>['query'];

export const financeAssistant = async (input: Input): Promise<Output> => {
  const payload = {
    model: 'gpt-3.5-turbo-0613',
    function_call: {
      name: 'run_sql_select_query',
    },
    functions: [functionSchema],
    messages: [
      {
        role: 'system',
        content: dedent`
          You are ChattyFinanceGPT, an AI bot that decides which finance command to run based on the user's input.
          The user is a human who is trying to analyse their finances.

          The SQL query you return should be a SELECT statement, you can use the following subset of the SELECT syntax:
          - SELECT column1, column2 AS alias3, FUNCTION(field4+field5) AS alias6, SUM(expression7) AS alias8, , table2.
          - TOP number
          - FROM table1, table2, (SELECT * FROM table3) alias
          - LEFT / RIGHT / INNER / OUTER / ANTI / SEMI / CROSS / NATURAL JOIN table2 ON condition / USING columns
          - WHERE condition
          - GROUP BY column1, column2, ROLLUP(a,b), CUBE(c,d,e), GROUPING SETS(g,h)
          - HAVING condition
          - ORDER BY column1, column2 DESC,
          - LIMIT number [OFFSET number]
          - UNION / UNION ALL select / INTERSECT / EXCEPT
          - +, -, *, /, %, AND, OR, NOT, BETWEEN, NOT BETWEEN, EXISTS (Subquery), > ALL (subquery/array), > ANY/SOME (subquery / array), [NOT] IN (subquery / array), LIKE
          - CAST (expression AS type)

          Aggregators:
          - SUM(), COUNT(), MIN(), MAX(), FIRST(), LAST(), AVG(), AGGR(), ARRAY(), REDUCE()

          GROUP BY Grouping functions:
          - ROLLUP(), CUBE(), GROUPING SETS()

          Functions:
          - ABS(), IIF(), IFNULL(), INSTR(), LOWER(), UPPER(), LCASE(), UCASE(), LEN(), LENGTH()
          - GREATEST(), LEAST()

          SELECT modifiers (non-standard SQL):
          - SELECT VALUE - get single value
          - SELECT ROW - get first row as an array
          - SELECT COLUMN - get first column as an array
          - SELECT MATRIX - get all results as an array of arrays

          The transactions database table has the following schema:
           - "transaction_id": String - e.g. "1"
           - "date": String - e.g. "2023-06-01"
           - "time": String - e.g. "09:23:15"
           - "card_number": String - e.g. "************1234"
           - "merchant": String - e.g. "Amazon"
           - "category": String - e.g. "Online Shopping"
           - "amount": String - e.g. "125.78"

           Context:
            - Current month: "2023-07"
            - The table name must be '?'
        `,
      },
      {
        role: 'user',
        content: `The user's statement is: "${input.question}"`,
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

  const {query} = JSON.parse(result.choices[0].message.function_call.arguments);

  return query as Output;
};
