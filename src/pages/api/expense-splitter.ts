import {expenseSplitter} from '@/lib/models/expense-splitter';
import {NextApiRequest, NextApiResponse} from 'next';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (typeof req.body !== 'object') {
    res.status(400).json({error: 'body must be an object'});
    return;
  }

  const {expenseAsNaturalLanguage} = req.body;
  if (!expenseAsNaturalLanguage) {
    res.status(400).json({error: 'expenseAsNaturalLanguage is required'});
    return;
  }
  const result = await expenseSplitter({expenseAsNaturalLanguage});
  res.status(200).json(result);
};

export default handler;
