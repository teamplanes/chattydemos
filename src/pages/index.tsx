import {
  Button,
  Container,
  Divider,
  Heading,
  Stack,
  Text,
} from '@chakra-ui/react';
import Link from 'next/link';

function Chatty() {
  return (
    <Container py={10}>
      <Stack spacing={6} mb={6}>
        <Heading>Chatty Demos</Heading>
        <Text as="p">
          This website shows 2 demos of applied AI in simple use-cases.
        </Text>
        <Divider />

        <Stack spacing={4}>
          <Text as="p">
            The first is <strong>&apos;ChattyFields&apos;</strong> which is an
            example of a conversational form, it has a pirate tone of voice (of
            course) and will continue to ask you questions until it has all of
            the pieces of info it needs.
          </Text>
          <Link href="/fields">
            <Button>Try it out</Button>
          </Link>
        </Stack>
        <Stack spacing={4}>
          <Text as="p">
            The second is <strong>&apos;ChattySplit&apos;</strong> which is a
            simple expense tracker that enables users to enter their expenses
            using natural language. The benefit of using GPT in this case to so
            that the tool does the reasoning/logic. This is also a simple
            example of how you can effectively use GPT for purely reasoning and
            then to do the maths yourself.
          </Text>
          <Link href="/split">
            <Button>Try it out</Button>
          </Link>
        </Stack>
      </Stack>
    </Container>
  );
}

export default Chatty;
