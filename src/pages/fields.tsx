/* eslint-disable consistent-return */
import {useEffect, useRef, useState} from 'react';
import {Button, Container, Heading, Input, Stack} from '@chakra-ui/react';
import {ChatGPTMessage} from './api/question';

const fields = [
  {
    label: 'Full name',
    key: 'fullName',
    context: 'Middle-name is optional',
  },
  {label: 'Email address', key: 'emailAddress', context: ''},
  {label: 'Favorite color', key: 'favoriteColor', context: ''},
  {
    label: 'Date of birth',
    key: 'dateOfBirth',
    context: 'Please sanitise the user input to DD/MM/YYYY format',
  },
];

const fetchQuestionStream = async (options: {
  history: ChatGPTMessage[];
  formStepIndex: number;
  fieldLabel: string;
  fieldContext: string;
  formState: Record<string, string>;
}) => {
  const result = await fetch('/api/question', {
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      history: options.history,
      formStepIndex: options.formStepIndex,
      fieldLabel: options.fieldLabel,
      fieldContext: options.fieldContext,
      formState: options.formState,
    }),
  });

  if (!result.ok) {
    throw new Error(result.statusText);
  }

  // This data is a ReadableStream
  const data = result.body;
  return data;
};

/* eslint-disable no-await-in-loop */
function Page() {
  const [formState, setFormState] = useState({} as Record<string, string>);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [hasBegun, setHasBegun] = useState(false);
  const [fieldIndex, setFieldIndex] = useState(0);
  const [response, setResponse] = useState('');
  const [answer, setAnswer] = useState('');
  const [history, setHistory] = useState<ChatGPTMessage[]>([]);

  const generateResponse = async (
    e?: React.SyntheticEvent<HTMLElement>,
  ): Promise<void | any> => {
    e?.preventDefault();

    setHasBegun(true);
    const newHistory = [...history];

    if (answer) {
      newHistory.push({
        content: answer,
        role: 'user',
      });

      setHistory(newHistory);
      setAnswer('');
    }

    if (!fields[fieldIndex]) {
      setIsComplete(true);
      return;
    }

    const data = await fetchQuestionStream({
      history: newHistory,
      formStepIndex: fieldIndex,
      fieldLabel: fields[fieldIndex].label,
      fieldContext: fields[fieldIndex].context,
      formState,
    });

    if (!data) {
      throw new Error('No data');
    }

    const reader = data.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let question = '';

    while (!done) {
      const {value, done: doneReading} = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value);

      if (chunkValue.startsWith('[COMPLETE]')) {
        const responseValue = chunkValue.replace('[COMPLETE]', '').trim();
        setFieldIndex((prev) => prev + 1);
        setResponse('');
        setAnswer('');
        setHistory([]);

        // There is a side-effect triggered by this state update
        setFormState((cur) => ({
          ...cur,
          [fields[fieldIndex].key]: responseValue,
        }));
        return;
      }
      question += chunkValue;
      setResponse(question);
    }

    setHistory((prev) => [
      ...prev,
      {
        content: question,
        role: 'assistant',
      },
    ]);

    inputRef.current?.focus();
  };

  useEffect(() => {
    if (hasBegun) generateResponse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formState]);

  if (isComplete) {
    return (
      <Container>
        <Stack direction="column" spacing={10} my={20}>
          <Heading lineHeight={1.2} as="h1" size="2xl">
            Thank you for your submission!
          </Heading>
          <pre>{JSON.stringify(formState, null, 2)}</pre>
        </Stack>
      </Container>
    );
  }

  return (
    <Container>
      {hasBegun ? (
        <Stack
          as="form"
          onSubmit={generateResponse}
          direction="column"
          spacing={10}
          my={20}
        >
          <Heading lineHeight={1.2} as="h1" size="2xl">
            {response}
          </Heading>
          <Input
            size="lg"
            ref={inputRef}
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
          <Button isDisabled={!answer} size="lg" type="submit">
            Submit
          </Button>
        </Stack>
      ) : (
        <Stack textAlign="center" direction="column" spacing={10} my={20}>
          <Heading lineHeight={1} as="h3" size="lg">
            Welcome to ChattyFields!
          </Heading>
          <Heading lineHeight={1.2} as="h1" size="2xl">
            Pirate Registration 🏴‍☠️
          </Heading>
          <Button size="lg" type="button" onClick={generateResponse}>
            Begin
          </Button>
        </Stack>
      )}
    </Container>
  );
}

export default Page;
