import readline from 'node:readline';

const rl = readline.createInterface({ input: process.stdin });

let initialized = false;
let threadId = null;

function send(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

rl.on('line', (line) => {
  if (!line.trim()) {
    return;
  }
  let message;
  try {
    message = JSON.parse(line);
  } catch {
    process.stderr.write(`invalid json: ${line}\n`);
    process.exit(1);
  }

  const { id, type, payload } = message;

  if (type === 'initialize') {
    if (initialized) {
      process.stderr.write('initialize called twice\n');
      process.exit(1);
    }
    initialized = true;
    send({ id, type: 'initialized', payload: { protocolVersion: payload?.protocolVersion ?? 2 } });
    return;
  }

  if (!initialized) {
    process.stderr.write('received message before initialize\n');
    process.exit(1);
  }

  if (type === 'thread/start') {
    threadId = 'thread-test-1';
    send({ id, type: 'thread/started', payload: { threadId } });
    return;
  }

  if (type === 'turn/start') {
    if (!threadId || payload?.threadId !== threadId) {
      process.stderr.write('turn/start before thread or thread mismatch\n');
      process.exit(1);
    }
    send({
      type: 'turn/notification',
      payload: {
        threadId,
        turnId: 'turn-test-1',
        message: 'starting turn',
      },
    });
    send({
      type: 'turn/diff',
      payload: {
        threadId,
        turnId: 'turn-test-1',
        path: 'src/example.txt',
        content: 'hello world',
      },
    });
    send({
      id,
      type: 'turn/complete',
      payload: {
        threadId,
        turnId: 'turn-test-1',
        status: 'completed',
      },
    });
    return;
  }

  process.stderr.write(`unknown message type: ${type}\n`);
  process.exit(1);
});
