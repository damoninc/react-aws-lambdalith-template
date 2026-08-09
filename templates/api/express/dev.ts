import { app } from './app';

const port = 3001;

app.listen(port, () => {
  console.log(`Local Express API: http://localhost:${port}`);
});
