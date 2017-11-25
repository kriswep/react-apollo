import React, { Component } from 'react';
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

// const LinkList = ({ allLinksQuery }) => {
class LinkList extends Component {
  componentDidMount() {
    this.subscribeToNewLinks();
    this.subscribeToNewVotes();
  }

  subscribeToNewLinks = () => {
    this.props.allLinksQuery.subscribeToMore({
      document: gql`
        subscription {
          Link(filter: { mutation_in: [CREATED] }) {
            node {
              id
              url
              description
              createdAt
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
        }
      `,
      updateQuery: (previous, { subscriptionData }) => {
        const newAllLinks = [
          ...previous.allLinks,
          subscriptionData.data.Link.node,
        ];
        const result = {
          ...previous,
          allLinks: newAllLinks,
        };
        return result;
      },
    });
  };

  subscribeToNewVotes = () => {
    this.props.allLinksQuery.subscribeToMore({
      document: gql`
        subscription {
          Vote(filter: { mutation_in: [CREATED] }) {
            node {
              id
              link {
                id
                url
                description
                createdAt
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
              user {
                id
              }
            }
          }
        }
      `,
      updateQuery: (previous, { subscriptionData }) => {
        const votedLinkIndex = previous.allLinks.findIndex(
          link => link.id === subscriptionData.data.Vote.node.link.id,
        );
        const link = subscriptionData.data.Vote.node.link;
        const newAllLinks = previous.allLinks.slice();
        newAllLinks[votedLinkIndex] = link;
        const result = {
          ...previous,
          allLinks: newAllLinks,
        };
        return result;
      },
    });
  };

  render() {
    // data still loading
    if (this.props.allLinksQuery && this.props.allLinksQuery.loading) {
      return <div>Loading</div>;
    }

    // error occured
    if (this.props.allLinksQuery && this.props.allLinksQuery.error) {
      return <div>Error</div>;
    }

    // render links
    const linksToRender = this.props.allLinksQuery.allLinks;

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
  }
}

// export wrapped in graphql container
export default graphql(ALL_LINKS_QUERY, { name: 'allLinksQuery' })(LinkList);
