import React from 'react';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

import Link from './Link';

const updateCacheAfterVote = (store, createVote, linkId) => {
  const data = store.readQuery({ query: ALL_LINKS_QUERY });

  const votedLink = data.allLinks.find(link => link.id === linkId);
  votedLink.votes = createVote.link.votes;

  store.writeQuery({ query: ALL_LINKS_QUERY, data });
};

// define query -> get all Links
export const ALL_LINKS_QUERY = gql`
  query AllLinksQuery {
    allLinks {
      id
      createdAt
      url
      description
      postedBy {
        id
        name
      }
      votes {
        id
        user {
          id
        }
      }
    }
  }
`;

const LinkList = ({ allLinksQuery }) => {
  // data still loading
  if (allLinksQuery && allLinksQuery.loading) {
    return <div>Loading</div>;
  }

  // error occured
  if (allLinksQuery && allLinksQuery.error) {
    return <div>Error</div>;
  }

  // render links
  const linksToRender = allLinksQuery.allLinks;

  return (
    <div>
      {linksToRender.map((link, index) => (
        <Link
          key={link.id}
          updateStoreAfterVote={updateCacheAfterVote}
          index={index}
          link={link}
        />
      ))}
    </div>
  );
};

// export wrapped in graphql container
export default graphql(ALL_LINKS_QUERY, { name: 'allLinksQuery' })(LinkList);
