/* eslint-disable react/no-array-index-key */
import {Debt, DebtGraph} from '@/lib/debt-graph';
import {completionPayload} from '@/lib/models/expense-splitter/completion-payload';
import {listOfFriends, me} from '@/lib/models/expense-splitter/config';
import {Output} from '@/lib/models/expense-splitter/types';
import {ChevronDownIcon} from '@chakra-ui/icons';
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Card,
  CardBody,
  Container,
  Flex,
  Heading,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Stack,
  Tag,
  Text,
  Textarea,
  Wrap,
  WrapItem,
  useToast,
} from '@chakra-ui/react';
import {CreateChatCompletionRequest} from 'openai';
import {useRef, useState} from 'react';
import {Panel, PanelGroup, PanelResizeHandle} from 'react-resizable-panels';

function ExpenseSplitter(props: {
  debts: Debt[];
  onAddNewExpense: (expense: string) => void;
  isAddingNewExpense: boolean;
}) {
  const [expense, setExpense] = useState('');
  return (
    <Container>
      <Stack direction="column" py={2} spacing={5}>
        <Card>
          <CardBody>
            <Heading size="md" mb={1}>
              Group
            </Heading>
            <Text fontSize="md" mb={3}>
              List of friends you are sharing expenses with
            </Text>
            <Wrap>
              {listOfFriends.map((friend) => {
                return (
                  <WrapItem key={friend}>
                    <Tag size="md">
                      {friend}
                      {friend === me ? ' (you)' : ''}
                    </Tag>
                  </WrapItem>
                );
              })}
            </Wrap>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            {props.debts.length ? (
              props.debts.map((debt) => (
                <li key={`${debt.from}-${debt.to}`}>
                  {debt.from} owes {debt.to} £{debt.amount.toFixed(2)}
                </li>
              ))
            ) : (
              <Text textAlign="center" color="gray.600">
                Add the first expense in the form below
              </Text>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardBody gap={2} display="flex" flexDirection="column">
            <Flex justifyContent="space-between">
              <Heading size="sm">Create new expense</Heading>
              <Menu>
                <MenuButton
                  size="xs"
                  as={Button}
                  rightIcon={<ChevronDownIcon />}
                >
                  Prefill examples
                </MenuButton>
                <MenuList fontSize="xs">
                  {[
                    'henry paid for the groups dinner, it was £10',
                    'Dom and I went for dinner together, I paid for it. The bill was £89.96',
                    'me, dom and Alex plaid snooker for a tenner, i paid',
                    "We played a game of bowling, it was £10 for the lane, Dom paid for it but Alex didn't bowl.",
                  ].map((example) => (
                    <MenuItem
                      borderBottom="1px solid"
                      borderBottomColor="gray.200"
                      css
                      maxW="3xs"
                      onClick={() => setExpense(example)}
                      key={example}
                    >
                      &quot;{example}&rdquo;
                    </MenuItem>
                  ))}
                </MenuList>
              </Menu>
            </Flex>
            <Textarea
              value={expense}
              onChange={(e) => setExpense(e.target.value)}
              placeholder="Enter the details of your expense"
            />
            <Flex justifyContent="flex-end" direction="row" gap={2}>
              <Button
                isLoading={props.isAddingNewExpense}
                colorScheme="teal"
                isDisabled={!expense}
                onClick={() => {
                  setExpense('');
                  props.onAddNewExpense(expense);
                }}
              >
                Add expense
              </Button>
            </Flex>
          </CardBody>
        </Card>
      </Stack>
    </Container>
  );
}

function CallLog(props: {
  callLog: Array<CreateChatCompletionRequest | Output>;
}) {
  return (
    <Stack direction="column" py={2} spacing={5}>
      {props.callLog.map((call, index) => {
        if ('model' in call && typeof call.model === 'string') {
          return (
            <Accordion key={index}>
              <AccordionItem id="twwwwoo22o">
                <h2>
                  <AccordionButton>
                    <Box as="span" flex="1" textAlign="left">
                      Section 1 title
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel pb={4}>
                  <Accordion key={`${index}123`}>
                    <AccordionItem id="twwwwooo">
                      <h2>
                        <AccordionButton>
                          <Box as="span" flex="1" textAlign="left">
                            Section 1 title
                          </Box>
                          <AccordionIcon />
                        </AccordionButton>
                      </h2>
                      <AccordionPanel pb={4}>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit,
                        sed do eiusmod tempor incididunt ut labore et dolore
                        magna aliqua. Ut enim ad minim veniam, quis nostrud
                        exercitation ullamco laboris nisi ut aliquip ex ea
                        commodo consequat.
                      </AccordionPanel>
                    </AccordionItem>
                  </Accordion>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          );
        }
        return <Card key={index}>{JSON.stringify(call, null, 2)}</Card>;
      })}
    </Stack>
  );
}

function ExpenseSplitterPage() {
  const {current: debtGraph} = useRef(new DebtGraph(listOfFriends));
  const [debts, setDebts] = useState<Array<Debt>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const [callLog, setCallLog] = useState<
    Array<CreateChatCompletionRequest | Output>
  >([]);

  const handleAddNewExpense = async (expense: string) => {
    setIsLoading(true);
    setCallLog((cur) => [
      ...cur,
      completionPayload({expenseAsNaturalLanguage: expense}),
    ]);

    try {
      const response = await fetch(`/api/expense-splitter`, {
        method: 'POST',
        body: JSON.stringify({expenseAsNaturalLanguage: expense}),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Something went wrong');
      }
      const data = (await response.json()) as Output;

      if (data.costType === 'equal_split') {
        debtGraph.addSharedExpense(data.paidBy, data.totalBill);
      } else if (data.costType === 'peer_split') {
        debtGraph.addDebt(data.peer, data.paidBy, data.totalBill);
      } else if (data.costType === 'subgroup_split') {
        debtGraph.addSharedExpense(data.paidBy, data.totalBill, data.peers);
      } else {
        throw new Error('Something went wrong');
      }

      setCallLog((cur) => [...cur, data]);
      setDebts(debtGraph.getSimplifiedDebts());
    } catch (e) {
      toast({
        title: 'Something went wrong',
        description: 'Please try again',
        status: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="container.sm" pt={20}>
      <ExpenseSplitter
        onAddNewExpense={handleAddNewExpense}
        debts={debts}
        isAddingNewExpense={isLoading}
      />
      {/* <PanelGroup direction="horizontal">
        <Panel defaultSize={40} minSize={30}>
          <ExpenseSplitter
            onAddNewExpense={handleAddNewExpense}
            debts={debts}
            isAddingNewExpense={isLoading}
          />
        </Panel>
        {/* <PanelResizeHandle style={{width: '10px', background: 'grey'}} />
        <Panel minSize={30}>
          {/* <Text whiteSpace="pre" fontSize={12}>
            {JSON.stringify(callLog, null, 2)}
          </Text>
          {/* <CallLog callLog={callLog} />
        </Panel>
      </PanelGroup> */}
    </Container>
  );
}

export default ExpenseSplitterPage;
