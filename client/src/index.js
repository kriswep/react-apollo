import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
// apollo deps
import { ApolloProvider } from 'react-apollo';
import { ApolloClient } from 'apollo-client';
import { HttpLink } from 'apollo-link-http';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { ApolloLink, split } from 'apollo-client-preset';
import { WebSocketLink } from 'apollo-link-ws';
import { getMainDefinition } from 'apollo-utilities';

import App from './components/App';
import { GC_AUTH_TOKEN } from './constants';
import registerServiceWorker from './registerServiceWorker';
import './styles/index.css';

// setup link - Plain HttpLink
const httpLink = new HttpLink({
  uri: 'https://api.graph.cool/simple/v1/cja5ax5200akm0171cqfoc8ah',
});

// auth middleware
const middlewareAuthLink = new ApolloLink((operation, forward) => {
  const token = localStorage.getItem(GC_AUTH_TOKEN);
  const authorizationHeader = token ? `Bearer ${token}` : null;
  operation.setContext({
    headers: {
      authorization: authorizationHeader,
    },
  });
  return forward(operation);
});

const httpLinkWithAuthToken = middlewareAuthLink.concat(httpLink);

// subscription link
const wsLink = new WebSocketLink({
  uri: `wss://subscriptions.graph.cool/v1/cja5ax5200akm0171cqfoc8ah`,
  options: {
    reconnect: true,
    connectionParams: {
      authToken: localStorage.getItem(GC_AUTH_TOKEN),
    },
  },
});

const link = split(
  ({ query }) => {
    const { kind, operation } = getMainDefinition(query);
    return kind === 'OperationDefinition' && operation === 'subscription';
  },
  wsLink,
  httpLinkWithAuthToken,
);

// setup client
const client = new ApolloClient({
  link,
  cache: new InMemoryCache(),
});

// wrap app in apollo and BrowserRouter HoC and render
ReactDOM.render(
  <BrowserRouter>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </BrowserRouter>,
  document.getElementById('root'),
);
registerServiceWorker();
