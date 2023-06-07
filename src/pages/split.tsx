/* eslint-disable react/button-has-type */
/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable no-restricted-syntax */
import {listOfFriends} from '@/lib/config';
import {Debt, DebtGraph} from '@/lib/debt-graph';
import {
  Box,
  Button,
  Container,
  Divider,
  Heading,
  Stack,
  Tag,
  Textarea,
  useToast,
} from '@chakra-ui/react';
import {useRef, useState} from 'react';

function Split() {
  const {current: debtGraph} = useRef(new DebtGraph(listOfFriends));
  const [cost, setCost] = useState('');
  const [debts, setDebts] = useState<Array<Debt>>([]);
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleCostChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCost(e.target.value);
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/split?cost=${cost}`);
      if (!response.ok) {
        throw new Error('Something went wrong');
      }
      const data = await response.json();

      if (data.command === 'equalSplit') {
        debtGraph.addSharedExpense(data.payload.paidBy, data.payload.totalBill);
      } else if (data.command === 'peerSplit') {
        debtGraph.addDebt(
          data.payload.peer,
          data.payload.paidBy,
          data.payload.totalBill,
        );
      } else if (data.command === 'subgroupSplit') {
        debtGraph.addSharedExpense(
          data.payload.paidBy,
          data.payload.totalBill,
          data.payload.peers,
        );
      } else {
        throw new Error('Something went wrong');
      }

      setCost('');
      setDebts(debtGraph.getSimplifiedDebts());
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container py={20}>
      <Stack spacing={10} direction="column" divider={<Divider />}>
        <Stack spacing={6} direction="column">
          <Heading>Welcome to ChattySplits</Heading>
          <Stack>
            {debts.length ? (
              debts.map((debt) => (
                <li key={`${debt.from}-${debt.to}`}>
                  {debt.from} owes {debt.to} £{debt.amount.toFixed(2)}
                </li>
              ))
            ) : (
              <Box>No debts between {listOfFriends.join(', ')}</Box>
            )}
          </Stack>
        </Stack>

        <Stack spacing={6} direction="column">
          <Heading>Friends</Heading>

          <Stack direction="row">
            {listOfFriends.map((friend) => (
              <Tag key={friend}>{friend}</Tag>
            ))}
          </Stack>
        </Stack>

        <Stack spacing={6} direction="column">
          <Heading>Manage cost</Heading>
          <Textarea
            value={cost}
            placeholder="Tell me who paid for what"
            onChange={handleCostChange}
          />
          <Button isLoading={isLoading} onClick={handleSubmit}>
            Submit
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}

export default Split;
