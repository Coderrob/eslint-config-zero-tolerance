import { default as client } from 'axios';
const options = { timeout: 1000 };
options!.timeout = 0;
client.get(url, options);
