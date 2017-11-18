import React from 'react';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

import Link from './Link';

// define query -> get all Links
const ALL_LINKS_QUERY = gql`
  query AllLinksQuery {
    allLinks {
      id
      createdAt
      url
      description
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
    <div>{linksToRender.map(link => <Link key={link.id} link={link} />)}</div>
  );
};

// export wrapped in graphql container
export default graphql(ALL_LINKS_QUERY, { name: 'allLinksQuery' })(LinkList);
