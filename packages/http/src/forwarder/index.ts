import axios from 'axios';
import { HttpForwarder } from './HttpForwarder';

const forwarder = new HttpForwarder();

export { forwarder };
export const CancelToken = axios.CancelToken;
