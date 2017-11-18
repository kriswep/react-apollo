import React from 'react';
import ReactDOM from 'react-dom';
import './styles/index.css';
import App from './components/App';
import registerServiceWorker from './registerServiceWorker';

// apollo deps
import { ApolloProvider } from 'react-apollo';
import { ApolloClient } from 'apollo-client';
import { HttpLink } from 'apollo-link-http';
import { InMemoryCache } from 'apollo-cache-inmemory';

// setup link - Plain HttpLink
const httpLink = new HttpLink({
  uri: 'https://api.graph.cool/simple/v1/cja5ax5200akm0171cqfoc8ah',
});

// setup client
const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});

// wrap app in apollo HoC and render
ReactDOM.render(
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>,
  document.getElementById('root'),
);
registerServiceWorker();
